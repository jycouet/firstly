import { getContext, setContext } from 'svelte'

import type { IconData, IconNode } from '../../core/BaseEnum.js'

export type { IconData, IconNode }

/**
 * Server rendering of `<Icon>`.
 * - `false`: an empty box of the right size, icon drawn in the browser (no layout jump, no HTML weight)
 * - `true`: full markup inlined on every occurrence
 * - `'sprite'`: each distinct icon is inlined once as a `<symbol>`, every occurrence is a `<use>`
 */
export type IconSsr = boolean | 'sprite'

export type IconOptions = {
	/** @default false */
	ssr?: IconSsr
	/** Lucide icons only. @default 2 */
	strokeWidth?: number | string
}

type IconContext = IconOptions & { sprites: Set<string> }

const KEY = Symbol('ff-icon')

/** Defaults for every `<Icon>` below. Call once in the root layout (also needed for `ssr: 'sprite'`). */
export const setIconOptions = (options: IconOptions = {}) => {
	setContext<IconContext>(KEY, { ...options, sprites: new Set() })
}

export const getIconContext = () => getContext<IconContext | undefined>(KEY)

const REGEX_ESCAPE = /[&"<>]/g
const REGEX_NAME = /^[a-z][\w:-]*$/i
const ESCAPES: Record<string, string> = { '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }

const esc = (v: string | number) => String(v).replace(REGEX_ESCAPE, (c) => ESCAPES[c]!)

export const isIconNode = (data: unknown): data is IconNode =>
	Array.isArray(data) && Array.isArray(data[0])

export const pick = (v: string | string[] | undefined, i = 0) => (Array.isArray(v) ? v[i] : v) ?? ''

const attr = (name: string, v: string | number | undefined) =>
	v === undefined || v === '' || !REGEX_NAME.test(name) ? '' : ` ${name}="${esc(v)}"`

/** Inner markup of the `<svg>`. Values are escaped: `data` may come from the DB. */
export const iconInner = (data: IconData, cls?: string | string[], style?: string | string[]) => {
	if (isIconNode(data)) {
		return data
			.filter(([tag]) => REGEX_NAME.test(tag))
			.map(
				([tag, attrs]) =>
					`<${tag}${Object.entries(attrs)
						.filter(([k]) => k !== 'key')
						.map(([k, v]) => attr(k, v))
						.join('')}/>`,
			)
			.join('')
	}
	return (Array.isArray(data) ? data : [data])
		.filter(Boolean)
		.map(
			(d, i) =>
				`<path${attr('d', d)} fill="currentColor"${attr('class', pick(cls, i))}${attr('style', pick(style, i))}/>`,
		)
		.join('')
}

/** djb2, base36: stable symbol id per distinct markup. */
const hash = (s: string) => {
	let h = 5381
	for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
	return (h >>> 0).toString(36)
}

export const strokeAttrs = (strokeWidth: number | string = 2) => ({
	fill: 'none',
	stroke: 'currentColor',
	'stroke-width': strokeWidth,
	'stroke-linecap': 'round',
	'stroke-linejoin': 'round',
})

/**
 * First occurrence in the request carries the `<symbol>`, the next ones only `<use>`.
 * `attrs` (Lucide stroke) live on the symbol so each `<use>` stays tiny.
 */
export const spriteInner = (
	sprites: Set<string>,
	inner: string,
	viewBox: string,
	attrs: Record<string, string | number> = {},
) => {
	const a =
		attr('viewBox', viewBox) +
		Object.entries(attrs)
			.map(([k, v]) => attr(k, v))
			.join('')
	const id = `ffi-${hash(a + inner)}`
	const use = `<use href="#${id}"/>`
	if (sprites.has(id)) return use
	sprites.add(id)
	return `<symbol id="${id}"${a}>${inner}</symbol>${use}`
}
