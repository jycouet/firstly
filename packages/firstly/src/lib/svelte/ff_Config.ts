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
	select?: string
	checkbox?: string
	input?: string
	container?: string
	header?: string
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
	grid?: GridTheme
	form?: FormTheme
}

// Default themes for each component
export const defaultFieldTheme: FieldTheme = {
	checkbox: 'checkbox',
	input: 'input',
	select: 'select',
	root: '',
	label: '',
	error: '',
}

export const defaultGridTheme: GridTheme = {
	root: 'table',
	actions: 'flex gap-2 justify-end',
	actionButton: 'text-xs',
	actionsColumn: 'text-right',
	actionsHeader: 'text-right',
}

export const defaultFormTheme: FormTheme = {
	root: '',
	fields: '',
	actions: 'flex justify-end gap-2 mt-4',
	submitButton: 'btn btn-primary',
	cancelButton: 'btn',
}

export const defaultTheme: Theme = {
	field: defaultFieldTheme,
	grid: defaultGridTheme,
	form: defaultFormTheme,
}

export function setTheme(theme: Theme): Theme {
	return setContext(THEME_KEY, deepMerge(defaultTheme, theme))
}

export function getTheme(): Theme {
	return getContext(THEME_KEY) || defaultTheme
}

export function getFieldTheme(): FieldTheme {
	const theme = getTheme()
	return theme.field || defaultFieldTheme
}

export function getGridTheme(): GridTheme {
	const theme = getTheme()
	return theme.grid || defaultGridTheme
}

export function getFormTheme(): FormTheme {
	const theme = getTheme()
	return theme.form || defaultFormTheme
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
