import { RestDataProvider, isBackend, remult, withRemult } from 'remult'

import type { LoadEvent } from '@sveltejs/kit'

/**
 * Wrap a SvelteKit UNIVERSAL load (`+page.ts` / `+layout.ts`) so plain global
 * `repo()` / `ff()` reads through the API (so `allowApiRead` / `apiPrefilter`
 * apply), on both SSR and CSR.
 *
 * - SSR: runs the body in a nested `withRemult` bound to `event.fetch` - gated, and
 *   scoped so a concurrent `+page.server.ts` keeps its own provider. SvelteKit
 *   inlines the response. `remult.user` is carried in so the body can read it.
 * - CSR / hydration: points the client `remult` at this page's `event.fetch` so the
 *   inlined SSR response is reused, then runs the body.
 *
 * (A universal load runs on the client too, so it must use `event.fetch`. For a
 * server-only load see `remultApiServerLoad` from `firstly/svelte/server`.)
 *
 * TODO(remult): the SSR branch is framework-agnostic (only needs `event.fetch`) -
 * candidate to live in remult (e.g. `withRemultFetch(fetch, body)`).
 */
export function remultApiUniversalLoad<T>(body: (event: LoadEvent) => Promise<T>) {
	return (event: LoadEvent): Promise<T> => {
		if (!isBackend()) {
			remult.apiClient.httpClient = event.fetch
			return body(event)
		}
		const user = remult.user
		return withRemult(
			async () => {
				remult.user = user
				return body(event)
			},
			{ dataProvider: new RestDataProvider(() => ({ httpClient: event.fetch })) },
		)
	}
}
