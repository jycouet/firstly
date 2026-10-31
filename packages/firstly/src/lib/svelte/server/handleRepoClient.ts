import type { Handle } from '@sveltejs/kit'
import { remult, RestDataProvider, type DataProvider } from 'remult'

import { getRequestEvent } from '$app/server'

import { recordReads, replayTag, type Reads } from '../replay.js'
import { setRepoClientRequest } from '../repoClient.js'

const KEY = Symbol('ff.repoClient')
type Locals = { [KEY]?: DataProvider }

setRepoClientRequest(() => (getRequestEvent().locals as Locals)[KEY])

/** Per request, so one user's reads can never land in another user's page. */
export const handleRepoClient: Handle = ({ event, resolve }) => {
	const reads: Reads = {}
	;(event.locals as Locals)[KEY] = new RestDataProvider(() => ({
		...remult.apiClient,
		httpClient: recordReads(event.fetch, reads),
	}))
	return resolve(event, {
		// A function: a `$` in a row must not be read as a replacement pattern.
		transformPageChunk: ({ html }) => html.replace('</head>', () => `${replayTag(reads)}</head>`),
	})
}
