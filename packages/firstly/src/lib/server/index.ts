import type { RequestEvent } from '@sveltejs/kit'

import { type ClassType } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { Module, type RemultServerOptions } from 'remult/server'
import { Log } from '@kitql/helpers'

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
	/** @deprecated use `remult` modules instead */
	modulesFF?: ModuleFF[]
}

export class ModuleFF {
	name: string
	log: Log

	priority?: number
	entities?: ClassType<any>[]
	controllers?: ClassType<any>[]
	initApi?: RemultServerOptions<RequestEvent>['initApi']
	initRequest?: RemultServerOptions<RequestEvent>['initRequest']
	/** @deprecated use `remult` modules instead */
	modulesFF?: ModuleFF[]

	constructor(input: ModuleInput) {
		this.name = input.name
		this.log = new Log(`firstly | ${this.name}`)
		this.priority = input.priority
		this.entities = input.entities
		this.controllers = input.controllers
		this.initApi = input.initApi
		this.initRequest = input.initRequest
		this.modulesFF = input.modulesFF
	}
}

// It's typed with real resolve now...
type Options = RemultServerOptions<RequestEvent<Partial<Record<string, string>>, any>> & {
	/** @deprecated use `remult` modules instead */
	modulesFF?: ModuleFF[] | undefined
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
	const modulesSorted = modulesFlatAndOrdered([...[...(o.modulesFF ?? []), sveltekit()]])

	const ffModulesToRemult = modulesSorted.map((m) => {
		return new Module({
			key: m.name,
			entities: m.entities ?? [],
			controllers: m.controllers ?? [],
			initApi: m.initApi,
			initRequest: m.initRequest,
		})
	})

	// REMULT P1: With Generate Migrations it's a bit hard to get all entities from all modules.
	entities = [
		...modulesSorted.flatMap((m) => m.entities ?? []),
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

		// native remult modules
		modules: [...(o.modules ?? []), ...ffModulesToRemult],
	})
}

/**
 * Full flat and ordered list by index and concatenaining the modules name
 */
export const modulesFlatAndOrdered = (modules: ModuleFF[]): ModuleFF[] => {
	const flattenModules = (modules: ModuleFF[], parentName = ''): ModuleFF[] => {
		return modules.reduce<ModuleFF[]>((acc, module) => {
			const fullName = parentName ? `${parentName}-${module.name}` : module.name
			// Create a new module object without the 'modules' property
			const { modulesFF: _, ...flatModule } = module
			const newModule = { ...flatModule, name: fullName }
			const subModules = module.modulesFF ? flattenModules(module.modulesFF, fullName) : []
			return [...acc, newModule, ...subModules]
		}, [])
	}

	const flatModules = flattenModules(modules)
	flatModules.sort((a, b) => (a.priority || 0) - (b.priority || 0))
	return flatModules
}
