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
