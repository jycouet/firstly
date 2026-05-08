import { remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

/**
 * Captured at `evlog()` `initApi` so drains can run AFTER the request's
 * Remult async context has been torn down (the SvelteKit handle calls drains
 * post-`resolve()`, by which point `remult.dataProvider` is no longer
 * accessible from the current async scope).
 */
let capturedDataProvider: DataProvider | undefined

export function captureDataProvider(dp: DataProvider) {
	capturedDataProvider = dp
}

export async function inDetachedContext<T>(fn: () => Promise<T>): Promise<T> {
	if (!capturedDataProvider) {
		try {
			if (remult.dataProvider) capturedDataProvider = remult.dataProvider
		} catch {
			// `remult.dataProvider` access throws when no async context exists
		}
	}
	if (!capturedDataProvider) {
		console.warn('[firstly/evlog] inDetachedContext: no captured dataProvider; running undetached')
		return fn()
	}
	return withRemult(fn, { dataProvider: capturedDataProvider }) as Promise<T>
}
