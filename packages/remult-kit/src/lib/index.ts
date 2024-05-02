import type { FindOptionsBase, Repository } from 'remult'

import 'remult'

import type { RequestEvent } from '@sveltejs/kit'

import { Log } from '@kitql/helpers'

import type { KitBaseEnumOptions, KitIcon } from './KitBaseEnum.js'
import type { KitCellsInput as KitCellsInputForExport } from './kitCellsBuildor.js'
import { kitStoreItem } from './kitStoreItem.js'
import { kitStoreList } from './kitStoreList.js'
import { default as Button } from './ui/Button.svelte'
import { default as Clipboardable } from './ui/Clipboardable.svelte'
import { default as DialogManagement } from './ui/dialog/DialogManagement.svelte'
import { default as FormEditAction } from './ui/dialog/FormEditAction.svelte'
import { default as Field } from './ui/Field.svelte'
import { default as FieldGroup } from './ui/FieldGroup.svelte'
import { default as Grid } from './ui/Grid.svelte'
import { default as GridPaginate } from './ui/GridPaginate.svelte'
import { default as Icon } from './ui/Icon.svelte'
import { default as FieldContainer } from './ui/internals/FieldContainer.svelte'
import { default as SelectMelt } from './ui/internals/select/SelectMelt.svelte'
import { default as Link } from './ui/link/Link.svelte'
import { default as LinkPlus } from './ui/link/LinkPlus.svelte'
import { default as Loading } from './ui/Loading.svelte'
import { default as Tooltip } from './ui/Tooltip.svelte'

export const logRemultKit = new Log('remult-kit')

export const KitRole = {
  Admin: 'KitAdmin',
}

export {
  Field,
  FormEditAction,
  Grid,
  GridPaginate,
  FieldGroup,
  Icon,
  Link,
  LinkPlus,
  Loading,
  Button,
  Tooltip,
  DialogManagement,
  FieldContainer,
  SelectMelt,
  Clipboardable,
}
export { dialog } from './ui/dialog/dialog.js'
export type { DialogMetaDataInternal } from './ui/dialog/dialog.js'
export { KitBaseEnum, getEnum, getEnums } from './KitBaseEnum.js'
export type { KitBaseEnumOptions } from './KitBaseEnum.js'
export { KitFields } from './KitFields.js'
export { LogToConsoleCustom } from './SqlDatabase/LogToConsoleCustom.js'
export { getEntityDisplayValue, isError, kitDbNamesOf, getFieldLinkDisplayValue } from './helper.js'
export {
  buildWhere,
  getPlaceholder,
  buildSearchWhere,
  kitCellsBuildor,
  kitCellBuildor,
  fieldsOf,
} from './kitCellsBuildor.js'
export { kitStoreItem }
export { kitStoreList }

export type KitCellsInput<entityType> = KitCellsInputForExport<entityType>
export type { KitCell } from './kitCellsBuildor.js'
export type { FindOptionsPlus } from './kitStoreList.js'
export type KitBaseItem = KitBaseEnumOptions & {
  id: string
  captionSub?: string | (string | undefined)[]
  href?: string
  repo?: Repository<any>
  sub?: {
    captionPre?: string
    repo?: Repository<any>
    item?: any
  }
}
export type KitStoreItem<T> = ReturnType<typeof kitStoreItem<T>>
export type KitStoreList<T> = ReturnType<typeof kitStoreList<T>>
export type KitBaseItemLight = Partial<KitBaseItem>

export { FilterEntity } from './virtual/FilterEntity.js'
export { UIEntity } from './virtual/UIEntity.js'

// Icons
export {
  LibIcon_Empty,
  LibIcon_Forbidden,
  LibIcon_ChevronDown,
  LibIcon_ChevronUp,
  LibIcon_ChevronLeft,
  LibIcon_ChevronRight,
  LibIcon_Search,
  LibIcon_Check,
  LibIcon_MultiCheck,
  LibIcon_Add,
  LibIcon_MultiAdd,
  LibIcon_Edit,
  LibIcon_Delete,
  LibIcon_Cross,
  LibIcon_Save,
  LibIcon_Man,
  LibIcon_Woman,
  LibIcon_Send,
  LibIcon_Load,
  LibIcon_Settings,
  LibIcon_Sort,
  LibIcon_SortAsc,
  LibIcon_SortDesc,
} from './ui/LibIcon.js'

export type { KitIcon }

// Formats & Utils
export { displayPhone, arrToStr } from './formats/strings.js'
export { displayCurrency } from './formats/numbers.js'
export { tw } from './utils/tailwind.js'
export { litOrStr } from './utils/types.js'
export type { ResolvedType, UnArray } from './utils/types.js'

declare module 'remult' {
  export interface RemultContext {
    url: URL
    setHeaders(headers: Record<string, string>): void
    setCookie(...args: Parameters<RequestEvent['cookies']['set']>): void
    deleteCookie(...args: Parameters<RequestEvent['cookies']['delete']>): void
  }

  export interface FieldOptions<entityType, valueType> {
    placeholder?: string

    suffix?: string
    suffixWithS?: boolean

    styleRadioUntil?: number

    step?: '1' | '0.1' | '0.01'

    href?: (item: entityType) => string

    // REMULT P3 Noam/Yoni convo
    // difference with `findOptions` of remult ?
    // `findOptionsForEdit` is only for insert & update.
    // 1-n impact with `findOptions`
    findOptionsForEdit?:
      | ((entity: entityType) => FindOptionsBase<valueType>)
      | FindOptionsBase<valueType>

    findOptionsLimit?: number
    createOptionWhenNoResult?: boolean

    // Currently only for filtering.
    multiSelect?: boolean

    skipForDefaultField?: boolean
  }

  export interface EntityOptions<entityType> {
    searchableFind?: (str: string) => FindOptionsBase<entityType>
    displayValue?: (item: entityType) => KitBaseItem
  }

  export interface UserInfo {
    session: {
      id: string
      expiresAt: Date
    }
  }
}
