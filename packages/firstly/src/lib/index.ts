import * as h from '@kitql/helpers'

export {
	/** alias for @kitql/helpers */
	h,
}

export const ff_Log = new h.Log('firstly')

// ******************************
// Core (pure TS, frontend-safe) - re-exported from lib/core/
// ******************************
export { BaseEnum } from './core/BaseEnum.js'
export type { BaseEnumOptions, BaseItem, BaseItemLight, FF_Icon } from './core/BaseEnum.js'
export { FF_Entity } from './core/FF_Entity.js'
export { FF_Role } from './core/common.js'
export { isError } from './core/helper.js'
export { tryCatch, tryCatchSync } from './core/tryCatch.js'
export type { ResolvedType, UnArray, RecursivePartial } from './core/types.js'
export { tw } from './core/tailwind.js'

// Misc primitives still exposed from the root.
export { FF_LogToConsole } from './SqlDatabase/FF_LogToConsole.js'
export { FilterEntity } from './virtual/FilterEntity.js'
export { UIEntity } from './virtual/UIEntity.js'

declare module 'remult' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	export interface FieldOptions<entityType, valueType> {
		placeholder?: string

		// suffix?: string
		// suffixWithS?: boolean
		// suffixEdit?: string
		// suffixEditWithS?: boolean

		// styleRadioUntil?: number

		// step?: '1' | '0.1' | '0.01' | '0.5'
	}
}
