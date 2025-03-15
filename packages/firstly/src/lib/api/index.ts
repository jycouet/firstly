import type { RequestEvent } from '@sveltejs/kit'

import { type ClassType } from 'remult'
import { remultSveltekit } from 'remult/remult-sveltekit'
import type { RemultServerOptions } from 'remult/server'
import { Log } from '@kitql/helpers'

import { building } from '$app/environment'

import { sveltekit } from '../sveltekit/server'

type ModuleInput = {
	/**
	 * The name of the module (usefull for logging and debugging purposes)
	 */
	name: string
	priority?: number
	entities?: ClassType<any>[]
	controllers?: ClassType<any>[]
	initApi?: RemultServerOptions<RequestEvent>['initApi']
	initRequest?: RemultServerOptions<RequestEvent>['initRequest']
	modules?: Module[]
}

export class Module {
	name: string
	log: Log

	priority?: number
	entities?: ClassType<any>[]
	controllers?: ClassType<any>[]
	initApi?: RemultServerOptions<RequestEvent>['initApi']
	initRequest?: RemultServerOptions<RequestEvent>['initRequest']
	modules?: Module[]

	constructor(input: ModuleInput) {
		this.name = input.name
		this.log = new Log(`firstly | ${this.name}`)
		this.priority = input.priority
		this.entities = input.entities
		this.controllers = input.controllers
		this.initApi = input.initApi
		this.initRequest = input.initRequest
		this.modules = input.modules
	}
}

type Options = RemultServerOptions<RequestEvent<Partial<Record<string, string>>, string | null>> & {
	modules?: Module[] | undefined
}

declare module 'remult' {
	export interface RemultContext {
		// REMULT: it should be there already ?! no?
		request: RequestEvent
		setHeaders(headers: Record<string, string>): void
		setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
		deleteCookie(...args: Parameters<RequestEvent['cookies']['delete']>): void
	}
}

export let entities: ClassType<any>[] = []
/**
 * it's basically `remultSveltekit` with the `modules` option
 * @deprecated will be done directly in remult when modules will be in 😉
 */
export const firstly = (o: Options) => {
	const modulesSorted = modulesFlatAndOrdered([
		...[...(o.modules ?? []), sveltekit()],
		new Module({
			name: 'default',
			entities: o.entities ?? [],
			controllers: o.controllers ?? [],
			initRequest: o.initRequest,
			initApi: o.initApi,
		}),
	])
	entities = modulesSorted.flatMap((m) => m.entities ?? [])

	return remultSveltekit({
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

		// Module part
		entities,
		controllers: modulesSorted.flatMap((m) => m.controllers ?? []),
		initRequest: async (kitEvent, op) => {
			for (let i = 0; i < modulesSorted.length; i++) {
				const f = modulesSorted[i].initRequest
				if (f) {
					try {
						await f(kitEvent, op)
					} catch (error) {
						modulesSorted[i].log.error(error)
					}
				}
			}
		},
		initApi: async (r) => {
			if (!building) {
				for (let i = 0; i < modulesSorted.length; i++) {
					const f = modulesSorted[i].initApi
					if (f) {
						try {
							await f(r)
						} catch (error) {
							modulesSorted[i].log.error(error)
						}
					}
				}
			}
		},
	})
}

/**
 * Full flat and ordered list by index and concatenaining the modules name
 */
export const modulesFlatAndOrdered = (modules: Module[]): Module[] => {
	const flattenModules = (modules: Module[], parentName = ''): Module[] => {
		return modules.reduce<Module[]>((acc, module) => {
			const fullName = parentName ? `${parentName}-${module.name}` : module.name
			// Create a new module object without the 'modules' property
			const { modules: _, ...flatModule } = module
			const newModule = { ...flatModule, name: fullName }
			const subModules = module.modules ? flattenModules(module.modules, fullName) : []
			return [...acc, newModule, ...subModules]
		}, [])
	}

	const flatModules = flattenModules(modules)
	flatModules.sort((a, b) => (a.priority || 0) - (b.priority || 0))
	return flatModules
}
