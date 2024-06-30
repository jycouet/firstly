import type { SvelteComponent } from 'svelte'
import { writable } from 'svelte/store'

import type { Repository } from 'remult'

import {
  LibIcon_Add,
  LibIcon_Delete,
  LibIcon_Edit,
  LibIcon_Search,
  type KitBaseItemLight,
  type KitCellsInput,
  type KitStoreItem,
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

export type DialogMetaData<entityType = any> = {
  detail?: KitBaseItemLight

  repo?: Repository<entityType>
  store?: KitStoreItem<entityType>
  cells?: KitCellsInput<entityType>
  defaults?: Partial<entityType>
  classes?: DialogClasses

  component?: new (...args: any[]) => SvelteComponent
  props?: any
  children?: any
  noThrow?: boolean
  wDelete?: boolean

  topicPrefixText?: string
}

type ResultClose<entityType = any> = {
  success: boolean
  item?: entityType
  // createRequest?: entityType
}

export type DialogType = 'custom' | 'confirm' | 'confirmDelete' | 'insert' | 'update' | 'view'
export type DialogMetaDataInternal<entityType = any> = DialogMetaData<entityType> & {
  id: number
  type: DialogType
  resolve: (result: ResultClose) => void
}
const createDialogManagement = () => {
  const { subscribe, update } = writable<DialogMetaDataInternal[]>([])

  // internal...
  const show = (dialog: DialogMetaData, type: DialogType) => {
    let resolve: any
    const promise = new Promise<ResultClose>((res) => {
      resolve = res
    })

    update((dialogs) => {
      return [...dialogs, { ...dialog, id: dialogs.length + 1, resolve, type }]
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
    // FIXME JYC: refactor this (no need repo? options?)
    form: <entityType>(
      type: 'insert' | 'update' | 'view',
      topic: string,
      repo: Repository<entityType>,
      cells: KitCellsInput<entityType>,
      options?: {
        defaults?: Partial<entityType>
        classes?: DialogClasses
        noThrow?: boolean
        wDelete?: boolean
        topicPrefixText?: string
      },
    ) => {
      const topicPrefixText = options?.topicPrefixText
        ? options?.topicPrefixText + ' '
        : type === 'insert'
          ? `Créer `
          : type === 'update'
            ? 'Modifier '
            : 'Détail '
      const detail: DialogMetaData<entityType> = {
        detail: {
          caption: (topicPrefixText + topic).trim(),
          icon: {
            data:
              type === 'insert' ? LibIcon_Add : type === 'update' ? LibIcon_Edit : LibIcon_Search,
          },
        },
        repo,
        // store,
        cells,
        defaults: options?.defaults,
        classes: options?.classes,
        noThrow: options?.noThrow,
        wDelete: options?.wDelete,
        topicPrefixText,
      }
      return show(detail, type)
    },

    show: (dialog: DialogMetaData) => {
      return show(dialog, 'custom')
    },

    // next step, give a result typed!
    close: (id: number, result: ResultClose) => {
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
