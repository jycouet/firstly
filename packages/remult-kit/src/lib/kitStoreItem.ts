import { BROWSER } from 'esm-env'
import { get, writable } from 'svelte/store'

import type { ErrorInfo, FindOptions, Repository } from 'remult'
// @ts-ignore
import type { idType } from 'remult/src/remult3/remult3'
import { Log } from '@kitql/helpers'

import { isError } from './helper'

type TheStoreItem<T> = {
  item: T | undefined
  loading?: boolean
  errors: ErrorInfo<T> | undefined
  globalError?: string | undefined
}

export const kitStoreItem = <T>(
  repo: Repository<T>,
  initValues: TheStoreItem<T> = {
    item: undefined,
    loading: true,
    errors: undefined,
    globalError: undefined,
  },
) => {
  const internalStore = writable<TheStoreItem<T>>(initValues)

  let lastOptions: FindOptions<T> | undefined

  return {
    subscribe: internalStore.subscribe,

    create: (item: Partial<T>) =>
      internalStore.set({
        item: repo.create(item),
        loading: false,
        errors: {},
        globalError: undefined,
      }),
    set: internalStore.set,

    fetch: async (id: idType<T>, options?: FindOptions<T>, onNewData?: (item: T) => void) => {
      if (BROWSER) {
        internalStore.update((s) => ({ ...s, loading: true }))

        try {
          const item = await repo.findId(id, options)
          lastOptions = options

          internalStore.set({ loading: false, item, errors: undefined, globalError: undefined })
          if (onNewData) {
            onNewData(item)
          }
        } catch (error) {
          if (isError<T>(error)) {
            internalStore.set({
              loading: false,
              item: {} as T,
              errors: {} as ErrorInfo<T>,
              globalError: error.message,
            })
          }
        }
      }
    },

    save: async (useInsert?: boolean) => {
      const s = get(internalStore)
      try {
        if (!s.item) {
          return
        }
        let item
        if (useInsert) {
          item = await repo.insert(s.item!)
        } else {
          item = await repo.save(s.item!)
        }
        internalStore.set({ loading: false, item, errors: undefined, globalError: undefined })
        return item
      } catch (error: any) {
        if (isError<T>(error)) {
          if (!error.modelState) {
            internalStore.set({
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            })
          } else {
            const errors: ErrorInfo<T> = {}
            for (const key in error.modelState) {
              // @ts-ignore
              errors[key] = error.modelState[key]
            }
            internalStore.set({ loading: false, item: s.item, errors, globalError: undefined })
          }
        }
        // After we updated everything, let's throw the error
        throw error
      }
    },

    /**
     * @deprecated, use `deleteMe` instead that has a better error handling (need to create a manualSet probably to be consistent with list part)
     */
    delete: async (item: T) => await repo.delete(item),

    deleteMe: async () => {
      const s = get(internalStore)
      if (!s.item) {
        new Log('remult-kit').error(`To delete an item, you need set it first.`)
        return
      }
      try {
        await repo.delete(s.item)
      } catch (error: any) {
        if (isError<T>(error)) {
          if (!error.modelState) {
            internalStore.set({
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            })
          } else {
            const errors: ErrorInfo<T> = {}
            for (const key in error.modelState) {
              // @ts-ignore
              errors[key] = error.modelState[key]
            }
            internalStore.set({ loading: false, item: s.item, errors, globalError: undefined })
          }
        }
        throw error
      }
    },
  }
}
