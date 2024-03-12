import { BROWSER } from 'esm-env'
import { onDestroy } from 'svelte'
import { writable } from 'svelte/store'

import { remult, type ClassType, type FindOptions } from 'remult'

type TheStoreList<T> = {
  items: T[]
  loading: boolean
  totalCount: number | undefined
}

export type FindOptionsPlus<T> = FindOptions<T> & { withCount?: boolean; withItems?: boolean }

/**
 * @param entity remult entity
 * @param initValues usually the data coming from SSR
 * @returns a store with the initial values and a listen() method to subscribe to changes
 *
 * Example
 * ```ts
 * const store = kitStoreList(Task)
 * $: browser && store.listen({ where: {} })
 * ```
 */
export const kitStoreList = <Entity>(
  entity: ClassType<Entity>,
  initValues: TheStoreList<Entity> = { items: [], loading: true, totalCount: undefined },
) => {
  const repo = remult.repo(entity)

  const { subscribe, set, update } = writable<TheStoreList<Entity>>({ ...initValues })
  let unSub: any = null

  onDestroy(async () => {
    await plzUnSub()
  })

  // if we already have a subscription, unsubscribe (on option update for example)
  const plzUnSub = async () => {
    if (unSub) {
      await unSub()
      unSub = null
    }
  }

  return {
    subscribe,

    repo,

    // We don't want to expose the set method, we want to use the manualSet method
    // set,

    manualSet: (info: TheStoreList<Entity>) => {
      set({ ...info })
    },

    fetch: async (
      options?: FindOptionsPlus<Entity>,
      onNewData?: (items?: Entity[], totalCount?: number) => void,
    ) => {
      if (BROWSER) {
        update((s) => ({ ...s, loading: true }))

        const withCount = options?.withCount ?? false
        const withItems = options?.withItems ?? true

        if (!withItems && !withCount) {
          throw new Error(`xxx.fetch() withItems and withCount can't be both false!`)
        } else if (!withItems && withCount) {
          const totalCount = await repo.count(options?.where)
          set({ loading: false, items: [], totalCount })
          if (onNewData) {
            onNewData(undefined, totalCount)
          }
        } else if (withItems && !withCount) {
          const items = await repo.find(options)
          set({ loading: false, items, totalCount: undefined })
          if (onNewData) {
            onNewData(items, undefined)
          }
        } else {
          const [items, totalCount] = await Promise.all([
            repo.find({ ...options }),
            repo.count(options?.where),
          ])
          set({ loading: false, items, totalCount })
          if (onNewData) {
            onNewData(items, totalCount)
          }
        }
      }
    },

    listen: async (options?: FindOptionsPlus<Entity>) => {
      if (BROWSER) {
        await plzUnSub()

        unSub = repo.liveQuery({ ...options }).subscribe(async (info) => {
          const withCount = options?.withCount ?? false

          let totalCount: number | undefined = undefined
          if (withCount) {
            totalCount = await repo.count(options?.where)
          }
          update((c) => {
            return { ...c, items: info.items, loading: false, ...(withCount ? { totalCount } : {}) }
          })
        })
      } else {
        throw new Error(`xxx.listen() Too early!

You should do like: 
  let tasks = tasksStore<Task>(taskRepo, data.tasks)
  $: browser && tasks.listen()
				`)
      }
    },
    // Could be usefull one day?
    // manualFill: (info: { items: T[]; totalCount?: number }) => {
    // 	set({ items: info.items, loading: false, totalCount: info.totalCount })
    // },
  }
}
