import type { CustomFieldComponent, getLayout } from './customField'
import { default as FF_Config } from './FF_Config.svelte'
import { default as FF_Display } from './FF_Display.svelte'
import { default as FF_Edit } from './FF_Edit.svelte'
import { default as FF_Error } from './FF_Error.svelte'
import { default as FF_Field } from './FF_Field.svelte'
import { default as FF_Form } from './FF_Form.svelte'
import { default as FF_Grid } from './FF_Grid.svelte'
import { default as FF_Hint } from './FF_Hint.svelte'
import { default as FF_Label } from './FF_Label.svelte'
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

export {
	FF_Grid,
	FF_Form,
	FF_Field,
	FF_Edit,
	FF_Config,
	FF_Display,
	FF_Label,
	FF_Error,
	FF_Hint,
	FF_Layout,
}

export type { DynamicCustomField, FieldGroup } from './customField'
export { FF_Repo } from './FF_Repo.svelte.js'
export { tryCatch, tryCatchSync } from './tryCatch'
export { overwriteOptions, deepMerge, isOfType } from './helpers'
export { dialog } from './dialog/dialog'

// ******************************
// Additions to Remult
// ******************************
declare module 'remult' {
	export interface FieldOptions<entityType, valueType> {
		ui?: {
			field?: {
				label?: 'show' | 'hide' | 'remove'
				error?: 'show' | 'hide' | 'remove'
				edit?: CustomFieldComponent<valueType, entityType>
				hint?: 'show' | 'hide' | 'remove'
			}
			display?: CustomFieldComponent<valueType, entityType>

			placeholder?: string
			step?: string | number | undefined
			hint?: string

			style?: Style & {
				mobile?: Style
				tablet?: Style
			}
		}
	}

	export interface EntityOptions<entityType> {
		ui?: {
			getLayout?: getLayout<entityType>
		}
	}
}

type Style = {
	width?: number
	widthLeft?: number
	widthRight?: number
}

// - [ ] Try to pnpm pack to see what css is needed.
//   - [ ] let's look at the data-ff-xxx story ?
//   - [ ] how lib defaults should be configured ?
//   - [ ] What deault css should be provided to the user ?
// - [ ] Add fform in readonly mode (readonly / edit / insert ?)
// - [ ] Filter Fields
// - [ ] Add cancel button to form
// - [ ] Create a dedicated FF_Dialog
// - [ ] Create a [crud] demo ? a [crud]/[detail] demo ?
