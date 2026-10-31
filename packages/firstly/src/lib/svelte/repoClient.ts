import { BROWSER } from 'esm-env'

import { remult, repo, RestDataProvider, type DataProvider } from 'remult'

import type { Repo } from './remultApiLoad.js'
import { replayReads } from './replay.js'

let requestProvider: () => DataProvider | undefined = () => undefined

export const setRepoClientRequest = (get: () => DataProvider | undefined) => {
	requestProvider = get
}

const baseFetch: typeof fetch = (input, init) => {
	const client = remult.apiClient.httpClient
	return typeof client === 'function'
		? (client as typeof fetch)(input, init)
		: globalThis.fetch(input, init)
}

const replay = BROWSER ? replayReads(baseFetch) : undefined
let browserProvider: DataProvider | undefined

const providerFor = () => {
	if (BROWSER)
		return (browserProvider ??= new RestDataProvider(() => ({
			...remult.apiClient,
			httpClient: replay,
		})))
	// Falling back to the server `repo` here would skip every api rule.
	const provider = requestProvider()
	if (!provider) throw new Error('repoClient: add `handleRepoClient` to your hooks.server')
	return provider
}

/**
 * A `repo` for components: reads go through the API on SSR too (rules apply, as the
 * current user), and hydration replays them, so `$derived(await repoClient(E).find())`
 * costs one query. Needs `handleRepoClient` in `hooks.server`.
 *
 * TODO: move to remult
 */
export const repoClient: Repo = (entity, dataProvider) =>
	repo(entity, dataProvider ?? providerFor())
