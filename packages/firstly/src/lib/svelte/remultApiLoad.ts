import { RestDataProvider, isBackend, remult, withRemult } from 'remult'

import type { LoadEvent, ServerLoadEvent } from '@sveltejs/kit'

// Run `body` with the global remult reading through `/api` (so the entity's API
// rules apply), via a nested `withRemult` scoped to THIS load - a concurrent
// `+page.server.ts` keeps its own provider, so there is no cross-load interference.
// `remult.user` is carried in so the body can read it.
//
// TODO(remult): framework-agnostic (only needs `event.fetch`) - candidate to live
// in remult directly (e.g. `withRemultFetch(fetch, body)`); the SvelteKit-typed
// wrappers below just keep `event`'s DX.
function gatedLoad<E extends { fetch: typeof globalThis.fetch }, T>(
	event: E,
	body: (event: E) => Promise<T>,
): Promise<T> {
	const user = remult.user
	return withRemult(
		async () => {
			remult.user = user
			return body(event)
		},
		{ dataProvider: new RestDataProvider(() => ({ httpClient: event.fetch })) },
	)
}

/**
 * Wrap a SvelteKit UNIVERSAL load (`+page.ts` / `+layout.ts`) so plain global
 * `repo()` / `ff()` reads through the API (so `allowApiRead` / `apiPrefilter`
 * apply), on both SSR and CSR.
 *
 * - SSR: scoped, gated, isolated from a concurrent `+page.server.ts`; SvelteKit
 *   inlines the response.
 * - CSR / hydration: points the client `remult` at this page's `event.fetch` so the
 *   inlined SSR response is reused, then runs the body.
 */
export function remultApiUniversalLoad<T>(body: (event: LoadEvent) => Promise<T>) {
	return (event: LoadEvent): Promise<T> => {
		if (!isBackend()) {
			remult.apiClient.httpClient = event.fetch
			return body(event)
		}
		return gatedLoad(event, body)
	}
}

/**
 * Wrap a SvelteKit SERVER load (`+page.server.ts`) so plain global `repo()` reads
 * through the API (as the current user) instead of the privileged in-process
 * provider. Use it only when a server load should see exactly what the API exposes;
 * otherwise a server load keeps the DB provider (gate rows with `backendPrefilter`).
 */
export function remultApiServerLoad<T>(body: (event: ServerLoadEvent) => Promise<T>) {
	return (event: ServerLoadEvent): Promise<T> => gatedLoad(event, body)
}
