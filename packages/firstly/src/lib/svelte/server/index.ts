import type { ServerLoadEvent } from '@sveltejs/kit'

import { withRemultFetch } from '../remultApiLoad.js'

export { handleCaching } from './handleCaching.js'

/**
 * Wrap a SvelteKit SERVER load (`+page.server.ts`) so plain global `repo()` reads
 * apply the API gate (as the current user) instead of the privileged DB provider.
 *
 * Reads go through `event.fetch`: SvelteKit dispatches same-origin server fetch
 * in-process (no network) and forwards cookies, so the app's real auth/hooks run
 * for each read. Use it only when a server load should see exactly what the API
 * exposes; otherwise a server load keeps the DB provider (gate rows with
 * `backendPrefilter`). Gates direct `repo()` reads; BackendMethods keep their own
 * `allowed` gate.
 */
export function remultApiServerLoad<T>(body: (event: ServerLoadEvent) => Promise<T>) {
	return (event: ServerLoadEvent): Promise<T> => withRemultFetch(event.fetch, () => body(event))
}
