import type { HandleClientError } from '@sveltejs/kit'

// Errors SvelteKit/Vite throw when a lazy chunk 404s after a deploy.
const CHUNK_LOAD_RE =
	/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/

type HandleClientErrorInput = Parameters<HandleClientError>[0]

export interface FfHandleErrorOptions {
	/** Matches chunk-load error messages. Default covers Vite/SvelteKit wording. */
	chunkLoadPattern?: RegExp
	/** `sessionStorage` key for the one-shot reload guard. Default `ff-reload`. */
	storageKey?: string
	/**
	 * How long (ms) a just-reloaded URL is treated as "already retried". A second
	 * failure inside this window is a genuine break and falls through to `onError`.
	 * Default 10000. Avoids needing an `afterNavigate` to clear the guard.
	 */
	retryWindowMs?: number
	/**
	 * Also treat a bare 404 as a stale-deploy failure. Off by default: it would
	 * hard-reload legitimate client-side "not found" routes. Turn on for SPA hosts
	 * where a missing chunk surfaces as a 404 with no chunk-load message.
	 */
	recoverOn404?: boolean
	/** Your own handler for errors that were not recovered (logging, custom UX). */
	onError?: HandleClientError
}

const DEFAULT_MESSAGE = 'Something went wrong'

/**
 * Composable `handleError` for `hooks.client.js` that recovers stale-deploy chunk
 * failures by hard-reloading once, then delegates everything else to your `onError`.
 *
 * ```js
 * // src/hooks.client.js
 * export const handleError = ffHandleError({
 *   onError: ({ error }) => { report(error); return { message: 'Oops' } },
 * })
 * ```
 *
 * The reload trusts the failure signal itself, not `updated.check()` (which lies
 * behind a CDN caching `version.json`). A time-boxed one-shot guard prevents loops.
 */
export function ffHandleError(options: FfHandleErrorOptions = {}): HandleClientError {
	const pattern = options.chunkLoadPattern ?? CHUNK_LOAD_RE
	const key = options.storageKey ?? 'ff-reload'
	const windowMs = options.retryWindowMs ?? 10_000

	return (input: HandleClientErrorInput) => {
		const looksStale =
			(options.recoverOn404 === true && input.status === 404) ||
			pattern.test(String(input.message))

		if (looksStale && reloadOnce(key, windowMs, input.event.url.href)) {
			return // page is unloading; no error surfaces
		}

		return options.onError?.(input) ?? { message: DEFAULT_MESSAGE }
	}
}

/** Hard-reload `href` unless it already failed within `windowMs`. Returns true if reloading. */
function reloadOnce(key: string, windowMs: number, href: string): boolean {
	try {
		const prev = sessionStorage.getItem(key)
		if (prev) {
			const [prevHref, prevAt] = prev.split('\n')
			if (prevHref === href && Date.now() - Number(prevAt) < windowMs) {
				sessionStorage.removeItem(key) // genuine break -> stop retrying
				return false
			}
		}
		sessionStorage.setItem(key, `${href}\n${Date.now()}`)
		location.assign(href) // bypasses SvelteKit's stale version check
		return true
	} catch {
		return false // no sessionStorage (private mode) -> don't risk a loop
	}
}
