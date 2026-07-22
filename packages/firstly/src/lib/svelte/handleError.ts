import type { HandleClientError } from '@sveltejs/kit'

// Errors SvelteKit/Vite throw when a lazy chunk 404s after a deploy.
const CHUNK_LOAD_RE =
	/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/

const STORAGE_KEY = 'ff-reload'
// A URL that failed again within this window is a genuine break, not a stale deploy.
const RETRY_WINDOW_MS = 10_000

type HandleClientErrorInput = Parameters<HandleClientError>[0]

/**
 * Composable `handleError` for `hooks.client.js` that recovers stale-deploy chunk
 * failures by hard-reloading once, then delegates everything else to your handler.
 *
 * ```js
 * // src/hooks.client.js
 * import { ffHandleError } from 'firstly/svelte'
 *
 * export const handleError = ffHandleError(({ error }) => {
 *   report(error)
 *   return { message: 'Oops' }
 * })
 * ```
 *
 * The reload trusts the failure signal itself, not `updated.check()` (which lies
 * behind a CDN caching `version.json`). A time-boxed one-shot guard prevents loops.
 */
export function ffHandleError(onError?: HandleClientError): HandleClientError {
	return (input: HandleClientErrorInput) => {
		if (CHUNK_LOAD_RE.test(String(input.message)) && reloadOnce(input.event.url.href)) {
			return // page is unloading; no error surfaces
		}
		return onError?.(input) ?? { message: 'Something went wrong' }
	}
}

/** Hard-reload `href` unless it already failed within the guard window. Returns true if reloading. */
function reloadOnce(href: string): boolean {
	try {
		const prev = sessionStorage.getItem(STORAGE_KEY)
		if (prev) {
			const [prevHref, prevAt] = prev.split('\n')
			if (prevHref === href && Date.now() - Number(prevAt) < RETRY_WINDOW_MS) {
				sessionStorage.removeItem(STORAGE_KEY) // genuine break -> stop retrying
				return false
			}
		}
		sessionStorage.setItem(STORAGE_KEY, `${href}\n${Date.now()}`)
		location.assign(href) // bypasses SvelteKit's stale version check
		return true
	} catch {
		return false // no sessionStorage (private mode) -> don't risk a loop
	}
}
