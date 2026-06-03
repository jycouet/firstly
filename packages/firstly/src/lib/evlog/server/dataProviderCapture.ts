import { remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

/**
 * Captured at `evlog()` `initApi` so drains can run AFTER the request's
 * Remult async context has been torn down (the SvelteKit handle calls drains
 * post-`resolve()`, by which point `remult.dataProvider` is no longer
 * accessible from the current async scope).
 *
 * First non-undefined capture wins and is never overwritten. Drains run
 * detached (post-`resolve()`), so if a concurrent request could swap this out
 * between request A's `resolve()` and A's drain, A's audit/trace rows would be
 * written into request B's provider. evlog therefore requires a STABLE
 * dataProvider: per-request (multi-tenant) providers are not supported - point
 * the `_ff_evlog_*` tables at a single shared store.
 */
let capturedDataProvider: DataProvider | undefined

export function captureDataProvider(dp: DataProvider) {
	if (capturedDataProvider) return
	capturedDataProvider = dp
}

/** Clear the captured provider (tests / HMR teardown). */
export function resetCapturedDataProvider() {
	capturedDataProvider = undefined
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
