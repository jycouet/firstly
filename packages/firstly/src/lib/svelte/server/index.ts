import { remult, withRemult } from 'remult'
import { TestApiDataProvider } from 'remult/server'

import type { ServerLoadEvent } from '@sveltejs/kit'

// SERVER-ONLY (imports `remult/server`). Never import from client-reachable code.

// Lazily wrap the app's dataProvider once. TestApiDataProvider dispatches repo()
// through the API pipeline in-process (so allowApiRead / apiPrefilter apply) and
// carries the current user - no event.fetch, no `/api` round-trip.
let apiDataProvider: ReturnType<typeof TestApiDataProvider> | undefined

/**
 * Wrap a SvelteKit SERVER load (`+page.server.ts`) so plain global `repo()` reads
 * apply the API gate (as the current user) instead of the privileged in-process
 * provider. Use it only when a server load should see exactly what the API exposes;
 * otherwise a server load keeps the DB provider (gate rows with `backendPrefilter`).
 * Gates direct `repo()` reads; BackendMethods keep their own `allowed` gate.
 *
 * TODO(remult): framework-agnostic (event passed through; provider read from
 * `remult`) - candidate to live in remult directly.
 */
export function remultApiServerLoad<T>(body: (event: ServerLoadEvent) => Promise<T>) {
	return (event: ServerLoadEvent): Promise<T> => {
		apiDataProvider ??= TestApiDataProvider({ dataProvider: remult.dataProvider })
		const user = remult.user
		return withRemult(
			async () => {
				remult.user = user
				return body(event)
			},
			{ dataProvider: apiDataProvider },
		)
	}
}
