import type { FindOptionsBase, Repository } from 'remult'

import 'remult'

import type { RequestEvent } from '@sveltejs/kit'

import type { KitBaseEnumOptions, KitIcon } from './KitBaseEnum.js'
import type { KitCellsInput as KitCellsInputForExport } from './kitCellsBuildor.js'
import { kitStoreItem } from './kitStoreItem.js'
import { kitStoreList } from './kitStoreList.js'
import { default as Button } from './ui/Button.svelte'
import { default as DialogManagement } from './ui/dialog/DialogManagement.svelte'
import { default as EachFields } from './ui/EachFields.svelte'
import { default as Field } from './ui/Field.svelte'
import { default as Grid } from './ui/Grid.svelte'
import { default as GridPaginate } from './ui/GridPaginate.svelte'
import { default as Icon } from './ui/Icon.svelte'
import { default as Link } from './ui/link/Link.svelte'
import { default as LinkPlus } from './ui/link/LinkPlus.svelte'
import { default as Loading } from './ui/Loading.svelte'
import { default as Tooltip } from './ui/Tooltip.svelte'

export const KitRole = {
  Admin: 'KitAdmin',
}

export {
  Field,
  Grid,
  GridPaginate,
  EachFields,
  Icon,
  Link,
  LinkPlus,
  Loading,
  Button,
  Tooltip,
  DialogManagement,
}
export { dialog } from './ui/dialog/dialog.js'
export { KitBaseEnum, getEnum, getEnums } from './KitBaseEnum.js'
export type { KitBaseEnumOptions } from './KitBaseEnum.js'
export { KitFields } from './KitFields.js'
export { KitValidators } from './KitValidators.js'
export { LogToConsoleCustom } from './SqlDatabase/LogToConsoleCustom.js'
export { getRepoDisplayValue } from './helper.js'
export {
  buildWhere,
  getPlaceholder,
  buildSearchWhere,
  kitCellsBuildor,
  kitCellBuildor,
  fieldsOf,
} from './kitCellsBuildor.js'
export type { KitCell } from './kitCellsBuildor.js'

export { kitStoreItem }

export { kitStoreList }
export { FilterEntity } from './virtual/FilterEntity.js'
export { UIEntity } from './virtual/UIEntity.js'
export { displayPhone, arrToStr } from './formats/strings.js'
export {
  LibIcon_Empty,
  LibIcon_Forbidden,
  LibIcon_ChevronDown,
  LibIcon_ChevronUp,
  LibIcon_ChevronLeft,
  LibIcon_ChevronRight,
  LibIcon_Search,
  LibIcon_Check,
  LibIcon_Add,
  LibIcon_MultiAdd,
  LibIcon_Edit,
  LibIcon_Delete,
  LibIcon_Cross,
  LibIcon_Save,
  LibIcon_Man,
  LibIcon_Woman,
  LibIcon_MultiCheck,
} from './ui/LibIcon.js'
export type { FindOptionsPlus } from './kitStoreList.js'
export { isError } from './helper.js'

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

export { litOrStr } from './utils/types.js'

export type KitBaseItemLight = Partial<KitBaseItem>

export type { KitIcon }

export { displayCurrency } from './formats/numbers.js'
export { tw } from './utils/tailwind.js'

export type KitCellsInput<entityType> = KitCellsInputForExport<entityType>

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

    // Currently only for filtering.
    multiSelect?: boolean

    // to not get all the list, but a filtered list
    // to replace by `findOptions` native of remult?
    // We need a function so that we can access remult.user
    narrowFind?: () => FindOptionsBase<valueType>
    narrowFindFunc?: (params: { id?: string; siteId?: number }) => FindOptionsBase<valueType>
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