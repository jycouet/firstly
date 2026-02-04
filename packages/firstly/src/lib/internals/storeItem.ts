import { BROWSER } from 'esm-env'
import { derived, get, writable } from 'svelte/store'

import type { EntityFilter, ErrorInfo, FindOptions, Repository } from 'remult'

import { ff_Log } from '../index.js'
import { isError } from './helper.js'

export interface StoreItem<T> {
	subscribe: (run: (value: TheStoreItem<T>) => void) => () => void
	create: (item: Partial<T>) => void
	set: (newItem: TheStoreItem<T>) => void
	fetch: (
		idOrWhere: string | number | EntityFilter<T>,
		options?: FindOptions<T>,
		onNewData?: (item: T | undefined) => void,
	) => Promise<void>
	save: () => Promise<T | undefined>
	delete: () => Promise<void>
	onChange: (prop: keyof T, callback: (newValue: any, oldValue: any) => void) => void
}

type TheStoreItem<T> = {
	item: T | undefined
	loading?: boolean
	initLoading?: boolean
	errors: ErrorInfo<T> | undefined
	globalError?: string | undefined
}

export const storeItem = <T>(
	repo: Repository<T>,
	initValues: TheStoreItem<T> = {
		item: undefined,
		loading: true,
		initLoading: true,
		errors: undefined,
		globalError: undefined,
	},
): StoreItem<T> => {
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
				initLoading: false,
				errors: {},
				globalError: undefined,
			})
		},

		// set: internalStore.set,
		set: (newItem: TheStoreItem<T>) => {
			internalStore.update(() => {
				return { ...newItem }
			})
		},

		/**
		 * Fetch by ID or WHERE clause
		 * ```ts
		 * // By ID (string or number)
		 * store.fetch(123)
		 * store.fetch('abc')
		 *
		 * // By WHERE clause (object)
		 * store.fetch({ siteId: 123 })
		 *
		 * // With composite keys, build the id with
		 * const id = repo.metadata.idMetadata.getId({a:1,b:2})
		 * store.fetch(id)
		 * ```
		 */
		fetch: async (
			idOrWhere: string | number | EntityFilter<T>,
			options?: FindOptions<T>,
			onNewData?: (item: T | undefined) => void,
		) => {
			if (BROWSER) {
				internalStore.update((s) => ({ ...s, loading: true }))
				try {
					const isId = typeof idOrWhere === 'string' || typeof idOrWhere === 'number'
					const item = isId
						? await repo.findId(idOrWhere as Parameters<Repository<T>['findId']>[0], options)
						: await repo.findFirst(idOrWhere as EntityFilter<T>, options)

					internalStore.update((s) => ({
						...s,
						loading: false,
						initLoading: false,
						item: item ?? ({} as T),
						errors: undefined,
						globalError: undefined,
					}))
					if (onNewData) {
						onNewData(item ?? undefined)
					}
				} catch (error) {
					if (isError<T>(error)) {
						internalStore.update((s) => ({
							...s,
							loading: false,
							initLoading: false,
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
		 * Skips save if no fields were changed (prevents empty UPDATE queries).
		 */
		save: async () => {
			const s = get(internalStore)
			try {
				if (!s.item) {
					return
				}
				// Skip save if no fields were actually changed
				try {
					const entityRef = repo.getEntityRef(s.item)
					if (!entityRef.isNew() && !entityRef.wasChanged()) {
						return s.item
					}
				} catch {
					// If getEntityRef fails, proceed with save (item might be a plain object)
				}
				internalStore.update((s) => ({ ...s, loading: true }))
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
				ff_Log.error(`To delete an item, you need set it first.`)
				return
			}
			try {
				internalStore.update((s) => ({ ...s, loading: true }))
				await repo.delete(s.item)
				internalStore.update((s) => ({
					...s,
					loading: false,
				}))
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
