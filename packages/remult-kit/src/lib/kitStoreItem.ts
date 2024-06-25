import { BROWSER } from 'esm-env'
import { derived, get, writable } from 'svelte/store'

import type { ErrorInfo, FindOptions, Repository } from 'remult'
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

  // Function to watch changes on a specific property of `item`
  const onChange = (prop: keyof T, callback: (newValue: any, oldValue: any) => void) => {
    const itemProperty = derived(internalStore, ($s) => $s.item && $s.item[prop])
    let oldValue: any

    // Subscribe to the derived store to monitor changes
    itemProperty.subscribe((newValue) => {
      if (newValue !== oldValue) {
        if (oldValue !== undefined) {
          // to avoid running on initial undefined state

          callback(newValue, oldValue)
        }
        oldValue = newValue
      }
    })
  }

  return {
    subscribe: internalStore.subscribe,

    create: (item: Partial<T>) => {
      internalStore.set({
        item: repo.create(item),
        loading: false,
        errors: {},
        globalError: undefined,
      })
    },

    // set: internalStore.set,
    set: (newItem: TheStoreItem<T>) => {
      internalStore.update((s) => {
        return { ...newItem }
      })
    },

    /**
     * if you have keys, build the id with
     * ```ts
     * const id = repo.metadata.idMetadata.getId({a:1,b:2})
     * store.fetch(id)
     * ```
     */
    fetch: async (
      id: Parameters<Repository<T>['findId']>[0],
      options?: FindOptions<T>,
      onNewData?: (item: T) => void,
    ) => {
      if (BROWSER) {
        internalStore.update((s) => ({ ...s, loading: true }))

        try {
          const item = await repo.findId(id, options)
          // lastOptions = options

          internalStore.update((s) => ({
            ...s,
            loading: false,
            item,
            errors: undefined,
            globalError: undefined,
          }))
          if (onNewData) {
            onNewData(item)
          }
        } catch (error) {
          if (isError<T>(error)) {
            internalStore.update((s) => ({
              ...s,
              loading: false,
              item: {} as T,
              errors: {} as ErrorInfo<T>,
              // @ts-ignore
              globalError: error.message,
            }))
          }
        }
      }
    },

    /**
     * `.save()` will `update` or `insert` the current item.
     */
    save: async () => {
      const s = get(internalStore)
      try {
        if (!s.item) {
          return
        }
        const item = await repo.save(s.item!)
        internalStore.update((s) => ({
          ...s,
          loading: false,
          item,
          errors: undefined,
          globalError: undefined,
        }))
        return item
      } catch (error: any) {
        if (isError<T>(error)) {
          if (!error.modelState) {
            internalStore.update((s) => ({
              ...s,
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            }))
          } else {
            const errors: ErrorInfo<T> = {}
            for (const key in error.modelState) {
              // @ts-ignore
              errors[key] = error.modelState[key]
            }
            internalStore.update((s) => ({
              ...s,
              loading: false,
              item: s.item,
              errors,
              globalError: undefined,
            }))
          }
        }
        // After we updated everything, let's throw the error
        throw error
      }
    },

    delete: async () => {
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
            internalStore.update((s) => ({
              ...s,
              loading: false,
              item: s.item,
              errors: undefined,
              globalError: error.message,
            }))
          } else {
            const errors: ErrorInfo<T> = {}
            for (const key in error.modelState) {
              // @ts-ignore
              errors[key] = error.modelState[key]
            }
            internalStore.update((s) => ({
              ...s,
              loading: false,
              item: s.item,
              errors,
              globalError: undefined,
            }))
          }
        }
        throw error
      }
    },

    onChange,
  }
}
