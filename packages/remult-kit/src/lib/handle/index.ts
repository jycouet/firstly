import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import type { RemultSveltekitServer } from 'remult/remult-sveltekit'

// import { Log } from '@kitql/helpers'

import type { Module } from '../api'

// const log = new Log('remult-kit')

/**
 * to bring `remult.` on the server side (after this hook, you have assess to `remult.user` for example !)
 */
const internalRemultHandle: (server: RemultSveltekitServer, modules?: Module[]) => Handle =
	(api, modules) => async (h) => {
		return await api.withRemult(h.event, async () => {
			if (modules !== undefined) {
				for (let i = 0; i < modules.length; i++) {
					const early = modules[i].earlyReturn
					if (early) {
						const ret = await early(h)
						if (ret.early) {
							return ret.resolve
						}
					}
				}
			}

			return await h.resolve(h.event)
		})
	}

export const remultKit: (api: {
	server: RemultSveltekitServer
	modulesSorted: Module[]
}) => Handle = ({ server, modulesSorted }) => {
	const handlesPre: Handle[] = []
	const handlesPost: Handle[] = []

	for (let i = 0; i < modulesSorted.length; i++) {
		if (modulesSorted[i].handlePreRemult) {
			handlesPre.push(modulesSorted[i].handlePreRemult!)
		}
		if (modulesSorted[i].handlePosRemult) {
			handlesPost.push(modulesSorted[i].handlePosRemult!)
		}
	}

	return sequence(
		// First
		sequence(...handlesPre),
		// Then
		internalRemultHandle(server, modulesSorted),
		// Finally
		sequence(...handlesPost),
	)
}
