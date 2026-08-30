import type { LoadEvent } from '@sveltejs/kit'

import { isBackend, remult, repo as globalRepo, RestDataProvider, withRemult } from 'remult'

export type Repo = typeof globalRepo

/**
 * A `repo` whose data access goes through the API via the given fetch:
 * API rules apply on SSR (as the current user), hydration replays the SSR
 * responses in the browser (one single query), nothing global is mutated
 * (safe when `+layout.ts` and `+page.ts` run in parallel), and the ambient
 * remult (user, context) stays in charge. Inherits `remult.apiClient` config.
 *
 * Name the result so the intent shows at every query:
 * ```ts
 * const repoClient = repoFetch(event.fetch)
 * await repoClient(Task).find()
 * ```
 *
 * TODO(remult): framework-agnostic (only needs a fetch) - candidate to live in
 * remult directly.
 */
export function repoFetch(
	fetch: typeof globalThis.fetch,
	options?: { url?: string },
): Repo {
	const dp = new RestDataProvider(() => ({
		...remult.apiClient,
		httpClient: fetch,
		...(options?.url ? { url: options.url } : {}),
	}))
	return (entity, dataProvider) => globalRepo(entity, dataProvider ?? dp)
}

/**
 * Wrap a load: the callback receives a repo bound to `event.fetch`.
 * Typed structurally on `{ fetch }`, so it works for universal loads
 * (`+page.ts` / `+layout.ts`) and server loads (`+page.server.ts`) alike.
 *
 * ```ts
 * export const load = loadRepo(async (repoClient) => ({
 * 	tasks: await repoClient(Task).find(),
 * })) satisfies PageLoad
 * ```
 *
 * TODO(remult): candidate to live in remult once shippable without SvelteKit
 * types (it already is - `{ fetch }` is structural).
 */
export function loadRepo<Ev extends { fetch: typeof globalThis.fetch }, R>(
	loadFn: (repoClient: Repo, event: Ev) => R,
): (event: Ev) => R {
	return (event) => loadFn(repoFetch(event.fetch), event)
}

/**
 * Run `body` in a scoped `withRemult` whose reads go through the API via `fetch`
 * (`allowApiRead` / `apiPrefilter` apply); a concurrent load keeps its own
 * provider. `remult.user` is carried in so the body can read it.
 *
 * @deprecated prefer `repoFetch` / `loadRepo` - no ambient scope needed.
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
 *
 * @deprecated prefer `loadRepo` - the CSR path here mutates the global
 * `remult.apiClient.httpClient`, which leaks between parallel loads.
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
