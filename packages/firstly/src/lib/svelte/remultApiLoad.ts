import type { LoadEvent } from '@sveltejs/kit'

import { isBackend, remult, RestDataProvider, withRemult } from 'remult'

/**
 * Run `body` in a scoped `withRemult` whose reads go through the API via `fetch`
 * (`allowApiRead` / `apiPrefilter` apply); a concurrent load keeps its own
 * provider. `remult.user` is carried in so the body can read it.
 *
 * TODO(remult): framework-agnostic (only needs a fetch) - candidate to live in
 * remult directly.
 */
export function withRemultFetch<T>(fetch: typeof globalThis.fetch, body: () => Promise<T>) {
	const user = remult.user
	return withRemult(
		async () => {
			remult.user = user
			return body()
		},
		{ dataProvider: new RestDataProvider(() => ({ httpClient: fetch })) },
	)
}

/**
 * Wrap a SvelteKit UNIVERSAL load (`+page.ts` / `+layout.ts`) so plain global
 * `repo()` / `ff()` reads through the API (so `allowApiRead` / `apiPrefilter`
 * apply), on both SSR and CSR.
 *
 * - SSR: runs the body in a scoped `withRemult` bound to `event.fetch` - gated,
 *   and a concurrent `+page.server.ts` keeps its own provider. SvelteKit inlines
 *   the response.
 * - CSR / hydration: points the client `remult` at this page's `event.fetch` so the
 *   inlined SSR response is reused, then runs the body.
 *
 * (A universal load runs on the client too, so it must use `event.fetch`. For a
 * server-only load see `remultApiServerLoad` from `firstly/svelte/server`.)
 */
export function remultApiUniversalLoad<T>(body: (event: LoadEvent) => Promise<T>) {
	return (event: LoadEvent): Promise<T> => {
		if (!isBackend()) {
			remult.apiClient.httpClient = event.fetch
			return body(event)
		}
		return withRemultFetch(event.fetch, () => body(event))
	}
}
