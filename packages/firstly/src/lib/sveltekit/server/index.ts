

import { remult } from 'remult'

import { Module } from '../../api'



/**
 * @deprecated will be done directly in remult when modules will be in 😉
 */
export const sveltekit: () => Module = () => {
	return new Module({
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
