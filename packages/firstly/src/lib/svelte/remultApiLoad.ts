import type { LoadEvent } from '@sveltejs/kit'

import { remult, repo as globalRepo, RestDataProvider } from 'remult'

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
 * Wrap a load: the callback receives a repo bound to `event.fetch`, then the event.
 * Defaults to a universal `LoadEvent`; pass a server load's event type explicitly
 * for `+page.server.ts` (only `fetch` is required, structurally).
 *
 * ```ts
 * export const load = loadRepo(async (repoClient, { params }) => ({
 * 	task: await repoClient(Task).findFirst({ id: params.id }),
 * })) satisfies PageLoad
 * ```
 *
 * TODO(remult): candidate to live in remult - only the `LoadEvent` default is
 * SvelteKit-specific, the constraint itself is structural.
 */
export function loadRepo<R, Ev extends { fetch: typeof globalThis.fetch } = LoadEvent>(
	loadFn: (repoClient: Repo, event: Ev) => R,
): (event: Ev) => R {
	return (event) => loadFn(repoFetch(event.fetch), event)
}


