import type { SvelteComponent } from 'svelte'
import { writable } from 'svelte/store'

import { type Repository } from 'remult'

import type { FF_Repo } from '../../svelte'

import {
	LibIcon_Add,
	LibIcon_Delete,
	LibIcon_Edit,
	LibIcon_Search,
	type BaseItemLight,
	type CellsInput,
	type StoreItem,
} from '../../'

export type DialogClasses = {
	/**
	 * for example `overflow-auto` to have a scrollbar in the dialog
	 */
	root?: string
	formGrid?: FormGrid
}
export type FormGrid =
	| 'grid-cols-1'
	| 'grid-cols-2'
	| 'grid-cols-3'
	| 'grid-cols-4'
	| 'grid-cols-1 lg:grid-cols-4'

export type DialogMetaData<entityType = unknown> = {
	detail?: BaseItemLight

	repo?: Repository<entityType>
	store?: StoreItem<entityType>
	cells?: CellsInput<entityType>
	defaults?: Partial<entityType>
	classes?: DialogClasses

	component?: new (...args: any[]) => SvelteComponent
	props?: any
	children?: any
	reThrow?: boolean
	wDelete?: boolean
	focusKey?: string

	topicPrefixText?: string
	r?: FF_Repo<entityType>
}

type ResultClose<entityType = unknown> = {
	success: boolean
	item?: entityType
	// createRequest?: entityType
}

export type DialogType =
	| 'custom'
	| 'confirm'
	| 'confirmDelete'
	| 'insert'
	| 'update'
	| 'view'
	| 'fform'
export type DialogFormType<entityType> = {
	cells?: CellsInput<entityType>
	defaults?: Partial<entityType>
	classes?: DialogClasses
	reThrow?: boolean
	wDelete?: boolean
	topicPrefixText?: string
	focusKey?: string
}
export type DialogMetaDataInternal<entityType = unknown> = DialogMetaData<entityType> & {
	id: number
	type: DialogType
	resolve: (result: ResultClose<entityType>) => void
}
const createDialogManagement = () => {
	const { subscribe, update } = writable<DialogMetaDataInternal[]>([])

	// internal...
	const show = <T>(dialog: DialogMetaData<T>, type: DialogType) => {
		let resolve: any
		const promise = new Promise<ResultClose>((res) => {
			resolve = res
		})

		update((dialogs) => {
			// Use type assertion to ensure proper typing
			const newDialog = {
				...dialog,
				id: dialogs.length + 1,
				resolve,
				type
			} as DialogMetaDataInternal

			return [...dialogs, newDialog]
		})

		return promise
	}

	return {
		confirm: (topic: string, text: string, icon?: string) => {
			const detail = {
				detail: {
					caption: 'Confirmez',
					icon: { data: icon },
				},
				children: `
					<p>
						${topic}
						<br />
						${text}
					</p>
				`,
			}
			return show(detail, 'confirm')
		},
		confirmDelete: (topic: string) => {
			const detail = {
				detail: {
					caption: 'Supprimer',
					icon: { data: LibIcon_Delete },
				},
				children: topic
					? `<p>Confirmez vous la suppression de: <br />- <b>${topic}</b> ?</p>`
					: 'Confirmer la suppression ?',
			}
			return show(detail, 'confirmDelete')
		},
		form: <entityType>(
			type: 'insert' | 'update' | 'view',
			topic: string,
			repo: Repository<entityType>,
			settings: DialogFormType<entityType>,
		) => {
			const topicPrefixText = settings?.topicPrefixText
				? settings?.topicPrefixText + ' '
				: type === 'insert'
					? `Créer `
					: type === 'update'
						? 'Modifier '
						: 'Détail '
			const detail: DialogMetaData<entityType> = {
				detail: {
					caption: (topicPrefixText + topic).trim(),
					icon: {
						data: type === 'insert' ? LibIcon_Add : type === 'update' ? LibIcon_Edit : LibIcon_Search,
					},
				},
				repo,
				// store,
				cells: settings.cells ?? [],
				defaults: settings?.defaults,
				classes: settings?.classes,
				reThrow: settings?.reThrow,
				wDelete: settings?.wDelete,
				focusKey: settings?.focusKey,
				topicPrefixText,
			}
			return show<entityType>(detail, type)
		},
		fform: <entityType>(r: FF_Repo<entityType>, settings: DialogFormType<entityType>) => {
			// const topicPrefixText = settings?.topicPrefixText
			// 	? settings?.topicPrefixText + ' '
			// 	: type === 'insert'
			// 		? `Créer `
			// 		: type === 'update'
			// 			? 'Modifier '
			// 			: 'Détail '

			const detail: DialogMetaData<entityType> = {
				detail: {
					caption: r.metadata.caption,
					icon: {
						data: LibIcon_Edit,
						// data: type === 'insert' ? LibIcon_Add : type === 'update' ? LibIcon_Edit : LibIcon_Search,
					},
				},
				// repo,
				// store,
				cells: settings.cells ?? [],
				defaults: settings?.defaults,
				classes: settings?.classes,
				reThrow: settings?.reThrow,
				wDelete: settings?.wDelete,
				focusKey: settings?.focusKey,
				r,
				// topicPrefixText,
			}
			return show<entityType>(detail, 'fform')
		},

		show: <T>(dialog: DialogMetaData<T>) => {
			return show<T>(dialog, 'custom')
		},

		// next step, give a result typed!
		close: <T>(id: number, result: ResultClose<T>) => {
			update((dialogs) => {
				dialogs.forEach((dialog) => {
					if (dialog.id === id) {
						dialog.resolve(result)
					}
				})
				return dialogs.filter((dialog) => dialog.id !== id)
			})
		},

		// usefull on navigation you want to close all popups
		closeAll: () => {
			update((dialogs) => {
				dialogs.forEach((dialog) => {
					dialog.resolve({ success: false })
				})
				return []
			})
		},

		subscribe,
	}
}

export const dialog = createDialogManagement()
