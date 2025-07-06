import { remult } from 'remult'

import { ModuleFF } from '../../server'

/**
 * @deprecated will be done directly in remult when modules will be in 😉
 */
export const sveltekit: () => ModuleFF = () => {
	return new ModuleFF({
		name: 'sveltekit',
		priority: -779,
		entities: [],
		controllers: [],
		initRequest: async (kitEvent, op) => {
			remult.context.setHeaders = (headers) => {
				kitEvent.setHeaders(headers)
			}
			remult.context.setCookie = (name, value, opts) => {
				kitEvent.cookies.set(name, value, opts)
			}
			remult.context.deleteCookie = (name, opts) => {
				kitEvent.cookies.delete(name, opts)
			}
		},
	})
}
