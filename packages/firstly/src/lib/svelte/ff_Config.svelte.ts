import { getContext, setContext } from 'svelte'

import type { DynamicCustomField } from '.'
import { deepMerge } from '.'

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
	error?: string
	container?: string
}

export interface LabelTheme {
	root?: string
}

export interface ErrorTheme {
	root?: string
}

export interface EditTheme {
	select?: string
	checkbox?: string
	input?: string
}

export interface HintTheme {
	root?: string
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
	groups?: string
	fields?: string
	actions?: string
	submitButton?: string
	cancelButton?: string
}

export interface DisplayTheme {
	checkbox?: string
}

export interface Theme {
	root?: string
	field?: FieldTheme
	label?: LabelTheme
	error?: ErrorTheme
	hint?: HintTheme
	edit?: EditTheme
	grid?: GridTheme
	form?: FormTheme
	display?: DisplayTheme
}

export const defaultTheme: Theme = {
	field: {},
	label: {},
	error: {},
	hint: {},
	edit: {},
	grid: {},
	form: {
		actions: 'ff-form-actions',
	},
	display: {},
}

export const emptyTheme: Theme = {
	field: {},
	label: {},
	error: {},
	hint: {},
	edit: {},
	grid: {},
	form: {},
	display: {},
}

export const daisyTheme: Theme = {
	field: {
		root: '',
		error: '',
	},
	label: {
		root: '',
	},
	error: {
		root: 'text-error',
	},
	hint: {
		root: 'italic text-sm',
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
		groups: '', // grid grid-cols-1
		actions: 'flex justify-end gap-2 mt-4',
		submitButton: 'btn btn-primary',
		cancelButton: 'btn',
	},
	display: {
		checkbox: 'checkbox',
	},
}

export type FullyDefinedTheme = {
	root: string
	field: FieldTheme
	label: LabelTheme
	error: ErrorTheme
	hint: HintTheme
	edit: EditTheme
	grid: GridTheme
	form: FormTheme
	display: DisplayTheme
}

export class FF_Theme {
	#theme = $state(emptyTheme)

	constructor(initialTheme: Theme = emptyTheme) {
		this.setTheme(initialTheme)
	}

	setTheme(theme: Theme) {
		this.#theme = deepMerge(emptyTheme, theme)
		setContext(THEME_KEY, this)
	}

	getTheme(): FullyDefinedTheme {
		return deepMerge(emptyTheme, this.#theme) as FullyDefinedTheme
	}

	getClasses<K extends keyof FullyDefinedTheme>(key: K, classes: Partial<FullyDefinedTheme[K]>) {
		const lvl = this.getTheme()[key]
		return deepMerge(lvl, classes)
	}
}

export function getThemeContext(): FF_Theme {
	return getContext(THEME_KEY) || new FF_Theme()
}

export function setTheme(theme: Theme) {
	const themeContext = getContext<FF_Theme>(THEME_KEY)
	if (themeContext) {
		themeContext.setTheme(theme)
	} else {
		const newTheme = new FF_Theme(theme)
		setContext(THEME_KEY, newTheme)
	}
}

export function getTheme(): FullyDefinedTheme {
	const themeContext = getThemeContext()
	return themeContext.getTheme()
}

export function getClasses<K extends keyof FullyDefinedTheme>(
	key: K,
	classes: Partial<FullyDefinedTheme[K]>,
) {
	const themeContext = getThemeContext()
	return themeContext.getClasses(key, classes)
}

/**
 * Dynamic Custom Field
 */
export function setDynamicCustomField(fn?: DynamicCustomField): void {
	setContext(DYNAMIC_CUSTOM_FIELD_KEY, fn)
}

export function getDynamicCustomField(): DynamicCustomField | undefined {
	return getContext<DynamicCustomField>(DYNAMIC_CUSTOM_FIELD_KEY)
}
