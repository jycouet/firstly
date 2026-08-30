import type { HandleClientError } from '@sveltejs/kit'

type HandleClientErrorInput = Parameters<HandleClientError>[0]

export type HandleClientErrorMiddleware = (next: HandleClientError) => HandleClientError

/**
 * Compose `handleError` middlewares into a single `hooks.client.js` handler.
 * Middlewares run outermost-first (the first argument wraps the rest). A middleware
 * either short-circuits (return without calling `next` - e.g. a hard reload) or calls
 * `next(input)`. The base returns `{ message: 'Something went wrong' }`.
 *
 * ```js
 * // src/hooks.client.js
 * import { stackHandleClientError, withStaleDeployReload } from 'firstly/svelte'
 *
 * export const handleError = stackHandleClientError(
 *   withStaleDeployReload(),
 *   (next) => (input) => {
 *     report(input.error) // your logging
 *     return next(input) // or return { message: 'Oops' } to stop here
 *   },
 * )
 * ```
 */
export function stackHandleClientError(
	...middlewares: HandleClientErrorMiddleware[]
): HandleClientError {
	return middlewares.reduceRight<HandleClientError>(
		(next, mw) => mw(next),
		() => ({ message: 'Something went wrong' }),
	)
}

// Errors SvelteKit/Vite throw when a lazy chunk 404s after a deploy.
const CHUNK_LOAD_RE =
	/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/

const STORAGE_KEY = 'ff-reload'
// A URL that failed again within this window is a genuine break, not a stale deploy.
const RETRY_WINDOW_MS = 10_000

/**
 * Middleware that recovers stale-deploy chunk failures: after a deploy an open client
 * (esp. SPA builds) 404s on a lazy chunk. Trusts the failure signal itself, not
 * `updated.check()` (which lies behind a CDN caching `version.json`), and hard-reloads
 * once - a time-boxed one-shot guard prevents reload loops. Only chunk-load errors
 * reload (a blind 404 reload would break client-side not-found routes); anything else
 * falls through to `next`.
 */
export function withStaleDeployReload(): HandleClientErrorMiddleware {
	return (next) => (input: HandleClientErrorInput) => {
		if (CHUNK_LOAD_RE.test(String(input.message)) && reloadOnce(input.event.url.href)) {
			return // page is unloading; no error surfaces
		}
		return next(input)
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
