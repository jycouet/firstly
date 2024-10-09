import type { RequestEvent } from '@sveltejs/kit'

import type { FindOptionsBase } from 'remult'
import { Log } from '@kitql/helpers'

import type { BaseEnum, BaseItem, FF_Icon } from './BaseEnum.js'
import type { CellsInput as CellsInput_ForExport } from './cellsBuildor.js'
import type { ColumnDeciderArgs } from './changeLog/index.js'
import { default as DefaultMail } from './mail/templates/DefaultMail.svelte'
import { storeItem } from './storeItem.js'
import { storeList } from './storeList.js'
import { default as Button } from './ui/Button.svelte'
import { default as Clipboardable } from './ui/Clipboardable.svelte'
import type { dialog } from './ui/dialog/dialog.js'
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

// ******************************
// Svelte Components
// ******************************
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
  DefaultMail,
}

// ******************************
// Objects
// ******************************
export const ff_Log = new Log('firstly')

export const FF_Role = {
  Admin: 'FF_Role.Admin',
}

// ******************************
// Helpers types
// ******************************
export type { BaseEnumOptions } from './BaseEnum.js'
export type { BaseItem }
export type BaseItemLight = Partial<BaseItem>

export type { DialogMetaDataInternal } from './ui/dialog/dialog.js'
export type CellsInput<entityType> = CellsInput_ForExport<entityType>
export type { Cell, VisibilityMode } from './cellsBuildor.js'
export type { FF_FindOptions } from './storeList.js'
export type StoreItem<T> = ReturnType<typeof storeItem<T>>
export type StoreList<T> = ReturnType<typeof storeList<T>>
export type { ResolvedType, UnArray, RecursivePartial } from './utils/types.js'

// ******************************
// Helpers
// ******************************
export { FF_Fields } from './FF_Fields.js'
export { FF_Entity } from './FF_Entity.js'
export { FF_LogToConsole } from './SqlDatabase/FF_LogToConsole.js'
export { BaseEnum } from './BaseEnum.js'
export { dialog } from './ui/dialog/dialog.js'
export {
  getEntityDisplayValue,
  isError,
  getFieldLinkDisplayValue,
  getEnum,
  getEnums,
  upsert,
  onDelete,
} from './helper.js'
export {
  buildWhere,
  getPlaceholder,
  buildSearchWhere,
  cellsBuildor,
  cellBuildor,
  fieldsOf,
  containsWords,
} from './cellsBuildor.js'
export { storeItem }
export { storeList }
export { displayPhone, arrToStr } from './formats/strings.js'
export { displayCurrency } from './formats/numbers.js'
export { tw } from './utils/tailwind.js'

// Hummm... I don't know if we should keep it...
export { FilterEntity } from './virtual/FilterEntity.js'
export { UIEntity } from './virtual/UIEntity.js'

// ******************************
// Icons
// ******************************
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

export type { FF_Icon }

// ******************************
// Additions to Remult
// ******************************
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
    suffixEdit?: string
    suffixEditWithS?: boolean

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
    createOptionWhenNoResult?: {
      onCreateRequest: (item: entityType, strCreateNew: string) => Parameters<typeof dialog.form>
      // It's of the other type...
      onSuccess: (entity: entityType, newItem: any) => Promise<void>
      onError?: () => void
    }

    multiSelect?: boolean

    skipForDefaultField?: boolean
  }

  export interface EntityOptions<entityType> {
    searchableFind?: (str: string) => FindOptionsBase<entityType>
    displayValue?: (item: entityType) => BaseItem

    permissionApiCrud?: BaseEnum[] | BaseEnum
    permissionApiDelete?: BaseEnum[] | BaseEnum
    permissionApiInsert?: BaseEnum[] | BaseEnum
    permissionApiRead?: BaseEnum[] | BaseEnum
    permissionApiUpdate?: BaseEnum[] | BaseEnum

    changeLog?: false | ColumnDeciderArgs<entityType>
  }

  export interface UserInfo {
    session: {
      id: string
      expiresAt: Date
    }
  }
}
