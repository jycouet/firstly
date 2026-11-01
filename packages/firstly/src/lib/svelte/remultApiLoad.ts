import type { LoadEvent, ServerLoadEvent } from '@sveltejs/kit'

import { repo as globalRepo, remult, RestDataProvider } from 'remult'

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
 * // +page.ts
 * import { repoFetch } from 'firstly/svelte'
 *
 * import type { PageLoad } from './$types'
 *
 * export const load: PageLoad = async (event) => {
 * 	const repoClient = repoFetch(event.fetch)
 * 	const tasks = await repoClient(Task).find()
 * 	return { tasks }
 * }
 * ```
 *
 * TODO(remult): framework-agnostic (only needs a fetch) - candidate to live in
 * remult directly.
 */
export function repoFetch(fetch: typeof globalThis.fetch, options?: { url?: string }): Repo {
	const dp = new RestDataProvider(() => ({
		...remult.apiClient,
		httpClient: fetch,
		...(options?.url ? { url: options.url } : {}),
	}))
	return (entity, dataProvider) => globalRepo(entity, dataProvider ?? dp)
}

/**
 * Wrap a load: the callback receives a repo bound to `event.fetch`, then the event.
 * Works for universal (`+page.ts`) AND server (`+page.server.ts`) loads:
 * `satisfies` types the event, including `cookies` and `locals` in a server load.
 *
 * ```ts
 * // +page.ts
 * import { loadRepo } from 'firstly/svelte'
 *
 * import type { PageLoad } from './$types'
 *
 * export const load = loadRepo(async (repoClient, { params }) => {
 * 	const task = await repoClient(Task).findFirst({ id: params.id })
 * 	return { task }
 * }) satisfies PageLoad // or PageServerLoad
 * ```
 *
 * TODO(remult): candidate to live in remult - only the event default is
 * SvelteKit-specific, the constraint itself is structural (`{ fetch }`).
 */
export function loadRepo<
	R,
	Ev extends { fetch: typeof globalThis.fetch } = LoadEvent | ServerLoadEvent,
>(loadFn: (repoClient: Repo, event: Ev) => R): (event: Ev) => R {
	return (event) => loadFn(repoFetch(event.fetch), event)
}
