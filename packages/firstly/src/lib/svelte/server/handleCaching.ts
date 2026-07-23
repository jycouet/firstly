import type { Handle } from '@sveltejs/kit'

// Cacheable static assets by extension (used to skip the no-cache header).
const STATIC_ASSET_RE = /\.(js|css|ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|eot)$/

/**
 * `hooks.server.js` handle that sets `Cache-Control` so browsers and CDNs cache
 * correctly across deploys - the server-side twin of `withStaleDeployReload`.
 *
 * - `/_app/immutable/*` (200 only) → `public, max-age=31536000, immutable`.
 *   Only this subtree is content-hashed; `/_app/version.json` and `/_app/env.js`
 *   are not, and MUST stay revalidatable or clients never see a new deploy.
 * - Everything else non-asset (HTML, API) and every non-200 → `no-cache, no-store,
 *   must-revalidate`. Never let a 404 carry a long max-age: a chunk 404 during a
 *   deploy window cached for a year bricks that client until devtools "disable cache".
 * - Other static assets (200, by extension) are left untouched for you to tune.
 *
 * Replaces purge-everything-on-deploy CDN strategies.
 *
 * ```js
 * // src/hooks.server.js
 * import { sequence } from '@sveltejs/kit/hooks'
 * import { handleCaching } from 'firstly/svelte/server'
 *
 * export const handle = sequence(handleCaching, ...rest)
 * ```
 */
export const handleCaching: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)
	const { pathname } = event.url

	if (pathname.startsWith('/_app/immutable/') && response.status === 200) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
	} else if (response.status !== 200 || !STATIC_ASSET_RE.test(pathname)) {
		response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
	}

	return response
}
