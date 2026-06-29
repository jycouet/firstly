import { type DataProvider, remult, withRemult } from 'remult'
import { TestApiDataProvider } from 'remult/server'

import type { ServerLoadEvent } from '@sveltejs/kit'

// Wrap the AMBIENT request dataProvider (the DB) in TestApiDataProvider so repo()
// reads apply the API rules (allowApiRead / apiPrefilter) as the current user. No
// dataProvider to pass - we read `remult.dataProvider`. Memoized by identity.
let cache: { db: DataProvider; api: DataProvider } | undefined
function apiDataProviderFor(db: DataProvider): DataProvider {
	if (cache?.db !== db) cache = { db, api: TestApiDataProvider({ dataProvider: db }) }
	return cache.api
}

/**
 * Wrap a SvelteKit SERVER load (`+page.server.ts`) so plain global `repo()` inside
 * it is subject to the API gate (as the current user) instead of the privileged
 * in-process provider. Gates direct `repo()` reads; BackendMethods keep their own
 * `allowed` gate.
 *
 * TODO(remult): framework-agnostic - the event is passed through untouched and the
 * dataProvider is read from `remult` - a candidate to live in remult directly.
 */
export function remultApiServerLoad<T>(body: (event: ServerLoadEvent) => Promise<T>) {
	return (event: ServerLoadEvent): Promise<T> => {
		const apiDp = apiDataProviderFor(remult.dataProvider)
		const user = remult.user
		return withRemult(
			async () => {
				remult.user = user
				return body(event)
			},
			{ dataProvider: apiDp },
		)
	}
}
