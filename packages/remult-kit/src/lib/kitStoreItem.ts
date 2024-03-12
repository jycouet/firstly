import { BROWSER } from 'esm-env'
import { get, writable } from 'svelte/store'

import { remult, type ClassType, type ErrorInfo, type FindOptions } from 'remult'
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

export const kitStoreItem = <Entity>(
  entity: ClassType<Entity>,
  initValues: TheStoreItem<Entity> = {
    item: undefined,
    loading: true,
    errors: undefined,
    globalError: undefined,
  },
) => {
  const repo = remult.repo(entity)

  const internalStore = writable<TheStoreItem<Entity>>(initValues)

  let lastOptions: FindOptions<Entity> | undefined

  return {
    subscribe: internalStore.subscribe,

    repo,

    create: (item: Partial<Entity>) =>
      internalStore.set({
        item: repo.create(item),
        loading: false,
        errors: {},
        globalError: undefined,
      }),
    set: internalStore.set,

    fetch: async (
      id: idType<Entity>,
      options?: FindOptions<Entity>,
      onNewData?: (item: Entity) => void,
    ) => {
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
          if (isError<Entity>(error)) {
            internalStore.set({
              loading: false,
              item: {} as Entity,
              errors: {} as ErrorInfo<Entity>,
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
        if (isError<Entity>(error)) {
          if (!error.modelState) {
            internalStore.set({
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            })
          } else {
            const errors: ErrorInfo<Entity> = {}
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
    delete: async (item: Entity) => await repo.delete(item),

    deleteMe: async () => {
      const s = get(internalStore)
      if (!s.item) {
        new Log('remult-kit').error(`To delete an item, you need set it first.`)
        return
      }
      try {
        await repo.delete(s.item)
      } catch (error: any) {
        if (isError<Entity>(error)) {
          if (!error.modelState) {
            internalStore.set({
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            })
          } else {
            const errors: ErrorInfo<Entity> = {}
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
