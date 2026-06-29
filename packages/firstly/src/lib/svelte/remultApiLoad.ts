import { RestDataProvider, isBackend, remult, withRemult } from 'remult'

import type { LoadEvent } from '@sveltejs/kit'

/**
 * Wrap a SvelteKit UNIVERSAL load (`+page.ts` / `+layout.ts`) so plain global
 * `repo()` / `ff()` inside it reads through the API (so `allowApiRead` /
 * `apiPrefilter` apply), on both SSR and CSR.
 *
 * - SSR (server): runs the body in a nested `withRemult` whose dataProvider is a
 *   `RestDataProvider` bound to `event.fetch`. The read goes through `/api` (gated),
 *   the override is scoped to this load (a concurrent `+page.server.ts` keeps its DB
 *   provider -> no cross-load interference), and SvelteKit inlines the response.
 * - CSR / hydration: points the client `remult` at this page's `event.fetch` (via
 *   `apiClient`) so the inlined SSR response is reused, then runs the body.
 *
 * Server loads (`+page.server.ts`) keep the privileged in-process provider; for a
 * gated server read see `remultApiServerLoad` (`firstly/svelte/server`).
 *
 * TODO(remult): framework-agnostic at the core (only needs `event.fetch`) - a
 * candidate to live in remult directly (e.g. `withRemultFetch(fetch, body)`); this
 * stays the SvelteKit-typed adapter so `event` keeps its `LoadEvent` DX.
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
