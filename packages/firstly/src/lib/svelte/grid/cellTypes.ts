import type { Component, Snippet } from 'svelte'

import type { ClassType, FieldMetadata } from 'remult'

/** Per-field UI hints. width/margins are PERCENTAGES of the parent row. */
export interface CellUI {
	/** Override the resolved input type ('text'|'number'|'date'|'checkbox'|'select'|'multiSelect'|...). */
	inputType?: string
	width?: number
	marginLeft?: number
	marginRight?: number
	/** Independent geometry for screens <= 40rem. */
	mobile?: { width?: number; marginLeft?: number; marginRight?: number }
	/** Column alignment in a grid. */
	align?: 'left' | 'center' | 'right'
	order?: number
}

/** How a resolved cell renders. */
export type MetaKind =
	| 'field' // remult displayValue of a primitive/enum field
	| 'field_link' // a field whose `options.href` makes it a link
	| 'relation' // a relation field (display via the related row)
	| 'enum' // single value-list
	| 'enum_multi' // array value-list
	| 'slot' // app owns the render (via cellSnippet)
	| 'component' // render an explicit component
	| 'header' // a static label cell (no field)
	| 'spacer' // empty layout cell

/** Resolved, headless cell descriptor consumed by FF_Grid / FF_Form. */
export interface Cell<E = any> {
	col?: keyof E & string
	field?: FieldMetadata<unknown, E>
	kind: MetaKind
	caption: string
	ui: CellUI
	/** Resolved input type for edit (getInputType). */
	inputType: string
	align: 'left' | 'center' | 'right'
	/** Tailwind/CSS passthrough (e.g. 'col-span-2'). */
	class?: string
	// ----- escape hatches (metadata SSoT, escape when needed) -----
	cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
	component?: Component
	rowToProps?: (row: E) => Record<string, unknown>
}

/** Terse author input: a bare field key, or a config object, or '_spacer'. */
export type CellInput<E> =
	| (keyof E & string)
	| {
			col: (keyof E & string) | '_spacer'
			kind?: MetaKind
			caption?: string
			ui?: CellUI
			align?: 'left' | 'center' | 'right'
			class?: string
			cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
			component?: Component
			rowToProps?: (row: E) => Record<string, unknown>
	  }

/** Geometry config for one of a cell's four sub-elements. */
export interface CellElementConfig {
	width?: number
	order?: number
	align?:
		| 'TopLeft'
		| 'TopCenter'
		| 'TopRight'
		| 'MiddleLeft'
		| 'MiddleCenter'
		| 'MiddleRight'
		| 'BottomLeft'
		| 'BottomCenter'
		| 'BottomRight'
	class?: string
	style?: string
}

/** App-level default geometry for the label/error/content/hint sub-elements. */
export interface CellConfig {
	label?: CellElementConfig
	error?: CellElementConfig
	content?: CellElementConfig
	hint?: CellElementConfig
}

// ---- remult metadata augmentation: per-field UI hints live ON the field (SSoT) ----
declare module 'remult' {
	interface FieldOptions<entityType, valueType> {
		/** firstly cell UI hints (width %, inputType, mobile, align). */
		ui?: CellUI
		/** Input placeholder. */
		placeholder?: string
		/** For multiSelect value-lists: the element value-list class. */
		valueTypeArray?: ClassType<valueType>
		/** When set, the field renders as a link (field_link kind). */
		href?: (row: entityType) => string
	}
}

export interface CellContentProps {
	component?: Component
	componentReadonly?: Component
	props?: Record<string, unknown>
	children?: string | Component
	config?: CellElementConfig
}
export interface CellElementProps {
	html?: string
	config?: CellElementConfig
}
export type CellMode = 'edit' | 'readonly'

export type CellProps = {
	key?: string
	mode?: CellMode
	label?: CellElementProps
	error?: CellElementProps
	hint?: CellElementProps
	content?: CellContentProps
	value?: unknown
	ui?: CellUI
}
