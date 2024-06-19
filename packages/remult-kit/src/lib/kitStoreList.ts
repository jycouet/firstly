import { BROWSER } from 'esm-env'
import { onDestroy } from 'svelte'
import { writable } from 'svelte/store'

import type { FindOptions, Repository } from 'remult'

type TheStoreList<T> = { items: T[]; loading: boolean; totalCount: number | undefined }

export type FindOptionsPlus<T> = FindOptions<T> & { withCount?: boolean; withItems?: boolean }

/**
 * @param repo remult repository to listen to
 * @param initValues usually the data coming from SSR
 * @returns a store with the initial values and a listen() method to subscribe to changes
 *
 * Example
 * ```ts
 * // get the repo
 * const taskRepo = remult.repo(Task)
 *
 * const tasks = kitStore(taskRepo, data.tasks)
 * $: browser && tasks.listen(data.options)
 * ```
 */
export const kitStoreList = <T>(
  repo: Repository<T>,
  initValues: TheStoreList<T> = { items: [], loading: true, totalCount: undefined },
) => {
  const { subscribe, set, update } = writable<TheStoreList<T>>(initValues)
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

    // set,
    manualSet: (info: TheStoreList<T>) => {
      set(info)
    },

    fetch: async (
      options?: FindOptionsPlus<T>,
      onNewData?: (items?: T[], totalCount?: number) => void,
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

    listen: async (options?: FindOptionsPlus<T>) => {
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

    getRepo: () => {
      return repo
    },
  }
}
