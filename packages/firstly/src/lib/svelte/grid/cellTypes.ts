import type { Component, Snippet } from 'svelte'

import type { ClassType, EntityFilter, EntityOrderBy, FieldMetadata } from 'remult'

/**
 * A component to render in a cell or as a form input. Always a THUNK, so an isomorphic entity `hub`
 * never statically pulls UI into the server graph:
 *   eager (in .svelte):  `() => Badge`
 *   lazy  (server-safe): `() => import('./Badge.svelte')`
 * The renderer resolves it once (cached) and unwraps a `{ default }` module.
 */
export type CellComponent = () => Component | Promise<Component> | Promise<{ default: Component }>

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
	/** Whether this column is sortable by header click (resolved; default: field/field_link columns). */
	sortable: boolean
	/** Tailwind/CSS passthrough (e.g. 'col-span-2'). */
	class?: string
	// ----- escape hatches (metadata SSoT, escape when needed) -----
	cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
	/** Render a component for this cell. Static `props` + per-row `rowToProps()` are merged into it. */
	component?: CellComponent
	props?: Record<string, unknown>
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
			/** Set false to make this column non-sortable (default: field/field_link are sortable). */
			sortable?: boolean
			cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
			/** Render a component for this cell (thunk). `props` + `rowToProps()` are merged into it. */
			component?: CellComponent
			props?: Record<string, unknown>
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

/** Per-action (create/edit/delete) config. Omit `cells` to inherit the list `cells`. */
export interface ActionConfig<E = any> {
	/** Fields shown in this action's form. Omit = inherit the list `cells`. */
	cells?: CellInput<E>[]
	/** Dialog title (e.g. from the row being edited). */
	title?: (row: E) => string
	/** Override the action's button icon (mdi path string). */
	icon?: string
	/** Escape: render a custom dialog component instead of the generated form. */
	component?: CellComponent
	props?: Record<string, unknown>
	rowToProps?: (row: E) => Record<string, unknown>
}

/**
 * Entity-level grid/form config — the SSoT. Declared on the entity (`@FF_Entity('x', { hub: {...} })`)
 * and read by FF_Grid / a boutique App_Grid as DEFAULTS; every prop overrides it. Keep it a plain,
 * cheap object: `cells` (strings), `where`, `orderBy`, `sortable`, action toggles + `title` fns are all
 * server-safe. Any UI `component` must be a lazy {@link CellComponent} thunk so the isomorphic entity
 * file never statically pulls Svelte into the server graph.
 */
export interface HubConfig<E = any> {
	/** Entity icon (mdi path string). */
	icon?: string
	/** Grid columns + the default fields for the create/edit forms. */
	cells?: CellInput<E>[]
	where?: EntityFilter<E>
	orderBy?: EntityOrderBy<E>
	strategy?: 'paginate' | 'listen' | 'load'
	pageSize?: number
	/** Create action; `false` to disable. Omit = on, using the list `cells`. */
	insert?: ActionConfig<E> | false
	/** Edit action; `false` to disable. */
	update?: ActionConfig<E> | false
	/** Delete action; `false` to disable. */
	delete?: ActionConfig<E> | false
}

// ---- entity-level config lives ON the entity (same SSoT idea as FieldOptions.ui, on EntityOptions) ----
declare module 'remult' {
	interface EntityOptions<entityType> {
		/** firstly grid/form config — read as defaults by FF_Grid / App_Grid, overridable per call. */
		hub?: HubConfig<entityType>
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
