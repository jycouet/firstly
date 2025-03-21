import { getContext, setContext } from 'svelte'

import type { DynamicCustomField } from './'
import { deepMerge } from './'

const THEME_KEY = 'firstly:theme'
const DYNAMIC_CUSTOM_FIELD_KEY = 'firstly:dynamicCustomField'

export interface Config {
	theme: Theme
	dynamicCustomField?: DynamicCustomField
}

/**
 * Theme
 */
export interface FieldTheme {
	root?: string
	label?: string
	error?: string
	container?: string
	header?: string
}

export interface EditTheme {
	select?: string
	checkbox?: string
	input?: string
}

export interface GridTheme {
	root?: string
	header?: string
	headerCell?: string
	row?: string
	rowCell?: string
	actions?: string
	actionButton?: string
	actionsColumn?: string
	actionsHeader?: string
	loadMoreButton?: string
}

export interface FormTheme {
	root?: string
	fields?: string
	actions?: string
	submitButton?: string
	cancelButton?: string
}

export interface Theme {
	root?: string
	field?: FieldTheme
	edit?: EditTheme
	grid?: GridTheme
	form?: FormTheme
}

// Default theme with all components
export const defaultTheme: Theme = {
	field: {
		root: '',
		label: '',
		error: '',
	},
	edit: {
		checkbox: 'checkbox',
		input: 'input',
		select: 'select',
	},
	grid: {
		root: 'table',
		actions: 'flex gap-2 justify-end',
		actionButton: 'text-xs',
		actionsColumn: 'text-right',
		actionsHeader: 'text-right',
	},
	form: {
		root: '',
		fields: '',
		actions: 'flex justify-end gap-2 mt-4',
		submitButton: 'btn btn-primary',
		cancelButton: 'btn',
	},
}

// Define a type with all required fields
export type FullyDefinedTheme = {
	root: string
	field: Required<FieldTheme>
	edit: Required<EditTheme>
	grid: Required<GridTheme>
	form: Required<FormTheme>
}

export function setTheme(theme: Theme) {
	return setContext(THEME_KEY, deepMerge(defaultTheme, theme)) as FullyDefinedTheme
}

export function getTheme() {
	return deepMerge(defaultTheme, getContext(THEME_KEY) || {}) as FullyDefinedTheme
}

export function getClasses<K extends keyof FullyDefinedTheme>(
	key: K,
	classes: Partial<FullyDefinedTheme[K]>,
) {
	const lvl = getTheme()[key]
	return deepMerge(lvl, classes)
}

/**
 * Dynamic Custom Field
 */
export function setDynamicCustomField(fn?: DynamicCustomField): void {
	setContext(DYNAMIC_CUSTOM_FIELD_KEY, fn)
}

export function getDynamicCustomField(): DynamicCustomField | undefined {
	return getContext(DYNAMIC_CUSTOM_FIELD_KEY)
}
