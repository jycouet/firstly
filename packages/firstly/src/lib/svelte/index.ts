import type { CellMetadata, getLayout } from './customField'
import { default as FF_Cell_Display } from './FF_Cell_Display.svelte'
import { default as FF_Cell } from './FF_Cell.svelte'
import { default as FF_Config } from './FF_Config.svelte'
import { default as FF_Form } from './FF_Form.svelte'
import { default as FF_Grid } from './FF_Grid.svelte'
import { default as FF_Layout } from './FF_Layout.svelte'

export type {
	FieldTheme,
	FormTheme,
	GridTheme,
	Theme,
	EditTheme,
	DisplayTheme,
} from './ff_Config.svelte.js'

export {
	getDynamicCustomField,
	getTheme,
	setDynamicCustomField,
	setTheme,
	getClasses,
	daisyTheme,
	defaultTheme,
	emptyTheme,
	FF_Theme,
} from './ff_Config.svelte.js'

export { FF_Grid, FF_Form, FF_Config, FF_Layout, FF_Cell, FF_Cell_Display }

export type { DynamicCustomField, FieldGroup } from './customField'
export { FF_Repo } from './FF_Repo.svelte.js'
export { tryCatch, tryCatchSync } from './tryCatch'
export { overwriteOptions, deepMerge, isOfType } from './helpers'
export { dialog } from './dialog/dialog'
export { SP } from './class/SP.svelte'
export type { ParamDefinition } from './class/SP.svelte'
export { initRemultSvelteReactivity } from './initRemultSvelteReactivity'

// ******************************
// Additions to Remult
// ******************************
declare module 'remult' {
	export interface FieldOptions<entityType = unknown, valueType = unknown> {
		ui?: CellMetadata<valueType, entityType>['ui']
	}

	export interface EntityOptions<entityType> {
		ui?: {
			getLayout?: getLayout<entityType>
		}
	}
}

// - [ ] Try to pnpm pack to see what css is needed.
//   - [ ] let's look at the data-ff-xxx story ?
//   - [ ] how lib defaults should be configured ?
//   - [ ] What deault css should be provided to the user ?
// - [ ] Add fform in readonly mode (readonly / edit / insert ?)
// - [ ] Add Filter Fields
// - [ ] Add actions form (cancel button to form, global error, ...)
// - [x] Create a dedicated FF_Dialog
//   - [ ] switch to data-ff-dialog (https://www.melt-ui.com/docs/builders/dialog example with non tailwind)
// - [ ] Create a [crud] demo ? a [crud]/[detail] demo ?
// - [ ] Add Toast ?
