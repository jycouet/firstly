import type { FieldMetadata } from 'remult'

import { ffConfig } from '../FF_Config.svelte.js'
import type { CellConfig, CellElementConfig, CellUI } from './cellTypes.js'

/** firstly's built-in geometry: label/error share a row, content + hint full width. */
export const defaultConfig: CellConfig = {
	label: { width: 50, order: 1, align: 'MiddleLeft' },
	error: { width: 50, order: 2, align: 'MiddleRight' },
	content: { width: 100, order: 3, align: 'MiddleLeft' },
	hint: { width: 100, order: 4, align: 'MiddleLeft' },
}

/** Build an inline style string for one sub-element from its CellElementConfig. */
export function getStyle(config: CellElementConfig): string {
	const justify = config.align?.includes('Left')
		? 'flex-start'
		: config.align?.includes('Right')
			? 'flex-end'
			: config.align?.includes('Center')
				? 'center'
				: undefined
	const items = config.align?.includes('Top')
		? 'start'
		: config.align?.includes('Bottom')
			? 'end'
			: config.align?.includes('Middle') || config.align?.includes('Center')
				? 'center'
				: undefined
	return [
		`width: ${config.width}%`,
		`flex: 0 0 ${config.width}%`,
		`order: ${config.order}`,
		`display: flex`,
		justify ? `justify-content: ${justify}` : '',
		items ? `align-items: ${items}` : '',
		config.style ?? '',
	]
		.filter(Boolean)
		.join('; ')
}

/**
 * Resolve a sub-element's geometry: firstly default <- app-level FF_Config `cell.config`.
 * MUST be called during component init (it reads context via `ffConfig()`).
 */
export function getCellElementConfig(element: keyof CellConfig): CellElementConfig {
	const appConfig = ffConfig().cell?.config ?? {}
	return { ...defaultConfig[element], ...appConfig[element] }
}

/** Resolved input type: merged `ui.inputType` > remult resolved `inputType` > 'text'. */
export function getInputType(field: FieldMetadata, ui?: CellUI): string {
	return ui?.inputType ?? field.inputType ?? 'text'
}
