import type { EntityMetadata, FieldMetadata } from 'remult'

import { getInputType } from './cellConfig.js'
import type { Cell, CellInput, CellUI, MetaKind } from './cellTypes.js'
import { getFieldMetaType } from './metaKind.js'

const HIDE_BY_DEFAULT = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt'])

/** Default column set when `selected` is omitted: visible fields minus id/timestamps. */
function defaultSelected<E>(meta: EntityMetadata<E>): (keyof E & string)[] {
	return meta.fields
		.toArray()
		.filter((f) => !HIDE_BY_DEFAULT.has(f.key) && !f.dbReadOnly && !f.isServerExpression)
		.map((f) => f.key as keyof E & string)
}

function alignFor(field: FieldMetadata | undefined, ui: CellUI): 'left' | 'center' | 'right' {
	if (ui.align) return ui.align
	if (field?.inputType === 'number') return 'right'
	return 'left'
}

/** Resolve the render kind: explicit > href(field_link) > metaKind(relation/enum) > field. */
function resolveKind(field: FieldMetadata | undefined, explicit?: MetaKind): MetaKind {
	if (explicit) return explicit
	if (!field) return 'spacer'
	if (field.options.href) return 'field_link'
	const mk = getFieldMetaType(field)
	if (mk.kind === 'relation') return 'relation'
	if (mk.kind === 'enum') return mk.subKind === 'multi' ? 'enum_multi' : 'enum'
	return 'field'
}

/**
 * Build headless cell descriptors from entity metadata.
 * `selected` is a terse list of field keys and/or config objects; omit it to auto-build
 * from visible fields. Per-cell config overrides the field's `ui` option (escape the SSoT).
 */
export function buildCells<E>(meta: EntityMetadata<E>, selected?: CellInput<E>[]): Cell<E>[] {
	const input: CellInput<E>[] = selected ?? defaultSelected(meta)
	return input.map((item) => {
		const isObj = typeof item === 'object'
		const colRaw = isObj ? item.col : item
		const spacer = colRaw === '_spacer'
		const field = !spacer
			? (meta.fields.find(colRaw as string) as FieldMetadata<unknown, E>)
			: undefined
		const fieldUI = field?.options.ui ?? {}
		const ui: CellUI = { ...fieldUI, ...(isObj ? item.ui : undefined) }
		const kind = spacer ? 'spacer' : resolveKind(field, isObj ? item.kind : undefined)
		return {
			col: spacer ? undefined : (colRaw as keyof E & string),
			field,
			kind,
			caption: (isObj && item.caption) || field?.caption || '',
			ui,
			inputType: field ? getInputType(field.options) : 'text',
			align: alignFor(field, ui),
			class: isObj ? item.class : undefined,
			cellSnippet: isObj ? item.cellSnippet : undefined,
			component: isObj ? item.component : undefined,
			rowToProps: isObj ? item.rowToProps : undefined,
		}
	})
}

/**
 * Formatted display string for a cell + row. Uses remult `field.displayValue` (which already
 * formats enums/dates/value-lists). Relations/multi-enum that need richer rendering should use
 * a `cellSnippet` escape hatch (Stage 0 does not auto-resolve the related row's caption).
 */
export function displayCell<E>(cell: Cell<E>, row: E): string {
	if (!cell.field) return ''
	const v = cell.field.displayValue(row as Partial<E>)
	return v ?? ''
}
