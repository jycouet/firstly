import { BROWSER } from 'esm-env'
import { derived, get, writable, type Writable } from 'svelte/store'

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

  // Derived store to keep track of current and previous values
  const historyStore = derived<
    Writable<TheStoreItem<T>>,
    { current: T | undefined; previous: T | undefined }
  >(internalStore, ($currentValue, set) => {
    const h = historyStore
    // @ts-ignore (keep this like this, I don't know why when I put get(), it's not working !)
    const p = h.previous ?? $currentValue.item

    set({ current: $currentValue.item, previous: p })

    // Update the previous value for the next call
    // @ts-ignore (this syntax to cut the reactivity)
    historyStore.previous = { ...$currentValue.item }
  })

  let fnOnChange: ((newItem: T, previousItem: T | undefined) => boolean) | undefined = undefined

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

    fetch: async (id: idType<T>, options?: FindOptions<T>, onNewData?: (item: T) => void) => {
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
        let item = await repo.save(s.item!)
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

    setOnChangeAction: (event: (newItem: T, previousItem: T | undefined) => boolean) => {
      fnOnChange = event
    },

    // Internal purpose only.
    onChange: (newItem: T) => {
      if (fnOnChange) {
        return fnOnChange(newItem, get(historyStore).previous)
      }
      return false
    },
  }
}
