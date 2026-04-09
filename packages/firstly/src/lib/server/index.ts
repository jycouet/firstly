import type { RequestEvent } from '@sveltejs/kit'

import { type ClassType } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { type RemultServerOptions } from 'remult/server'

type Options = RemultServerOptions<RequestEvent<Partial<Record<string, string>>, any>>

declare module 'remult' {
	export interface RemultContext {
		// REMULT: it should be there already ?! no?
		request: RequestEvent
	}
}

export let entities: ClassType<any>[] = []
/**
 * it's basically `remultSveltekit` with the `modules` option
 * @deprecated will be done directly in remult when modules will be in 😉
 */
export const firstly = (o: Options) => {
	// REMULT P1: With Generate Migrations it's a bit hard to get all entities from all modules.
	entities = [
		...(o.entities ?? []),
		//Managing only the first level... should be ok for now...
		...(o?.modules?.flatMap((m) => m.entities ?? []) ?? []),
	]

	return remultApi({
		// Changing the default default of remult
		logApiEndPoints: false,
		admin: true,
		defaultGetLimit: 25,
		error: o.error
			? o.error
			: async (e) => {
					// REMULT P2: validation error should probably be 409
					// if 400 we move to 409
					if (e.httpStatusCode == 400) {
						e.sendError(409, e.responseBody)
					}
				},
		// Add user configuration
		...o,
	})
}
