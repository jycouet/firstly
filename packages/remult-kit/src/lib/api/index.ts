import { type Handle, type MaybePromise, type RequestEvent } from '@sveltejs/kit'

import { remult, type ClassType } from 'remult'
import { remultSveltekit } from 'remult/remult-sveltekit'
import type { RemultServerOptions } from 'remult/server'
import { Log } from '@kitql/helpers'

import { building } from '$app/environment'

export type Module = {
  /**
   * The name of the module (usefull for logging and debugging purposes)
   */
  name: string
  index?: number
  entities?: ClassType<any>[]
  controllers?: ClassType<any>[]
  initApi?: RemultServerOptions<RequestEvent>['initApi']
  initRequest?: RemultServerOptions<RequestEvent>['initRequest']
  handlePreRemult?: Handle
  handlePosRemult?: Handle
  earlyReturn?: (
    input: Parameters<Handle>[0],
  ) => MaybePromise<
    { early: false; resolve?: never } | { early: true; resolve: ReturnType<Handle> }
  >
  modules?: Module[]
}

type Options = Omit<
  RemultServerOptions<RequestEvent<Partial<Record<string, string>>, string | null>> & {
    modules?: Module[] | undefined
    // log?: boolean | string
  },
  'entities' | 'controllers' | 'initRequest' | 'initApi'
>

/**
 * it's basically `remultSveltekit` with the `modules` option
 */
export const remultKit = (o: Options) => {
  const modulesSorted = modulesFlatAndOrdered(o.modules ?? [])
  const entities = modulesSorted.flatMap((m) => m.entities ?? [])

  return {
    modulesSorted: modulesSorted,

    entities,

    server: remultSveltekit({
      // Changing the default default of remult
      logApiEndPoints: false,
      admin: true,
      defaultGetLimit: 25,

      // Add user configuration
      ...o,

      // Module part
      entities,
      controllers: modulesSorted.flatMap((m) => m.controllers ?? []),
      initRequest: async (kitEvent, op) => {
        // usefull for later...
        remult.context.url = kitEvent.url

        for (let i = 0; i < modulesSorted.length; i++) {
          const f = modulesSorted[i].initRequest
          if (f) {
            try {
              await f(kitEvent, op)
            } catch (error) {
              const log = new Log(`remult-kit - ${modulesSorted[i].name}`)
              log.error(error)
            }
          }
        }

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
      initApi: async (r) => {
        if (!building) {
          for (let i = 0; i < modulesSorted.length; i++) {
            const f = modulesSorted[i].initApi
            if (f) {
              try {
                await f(r)
              } catch (error) {
                const log = new Log(`remult-kit [${modulesSorted[i].name}]`)
                log.error(error)
              }
            }
          }
        }
      },
    }),
  }
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
  flatModules.sort((a, b) => (a.index || 0) - (b.index || 0))
  return flatModules
}
