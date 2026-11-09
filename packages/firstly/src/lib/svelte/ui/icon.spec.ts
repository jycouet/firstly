import { brotliCompressSync, gzipSync } from 'node:zlib'
import { mdiDelete, mdiEye, mdiPencil } from '@mdi/js'
import { Eye, Pencil, Trash2 } from 'lucide'
import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'

import IconTable from './_test/IconTable.svelte'
import { iconInner, spriteInner, type IconData, type IconOptions } from './icon.js'

const REGEX_SYMBOL = /<symbol /g
const REGEX_USE = /<use /g
const REGEX_PATH = /<path /g

const NAMES = ['Jean', 'Marie', 'Luc', 'Anne', 'Paul', 'Chloé', 'Hugo', 'Léa']
const CITIES = ['Paris', 'Lyon', 'Nantes', 'Lille', 'Bordeaux', 'Grenoble']

// Deterministic, varied rows: real tables don't compress like a copy-pasted line
const makeRows = (n: number) => {
	let seed = 42
	const rnd = (max: number) => ((seed = (seed * 16807) % 2147483647), seed % max)
	return Array.from({ length: n }, (_, i) => {
		const name = NAMES[rnd(NAMES.length)]!
		return [
			`#${1000 + i}`,
			`${name} ${String.fromCharCode(65 + rnd(26))}.`,
			`${name.toLowerCase()}${rnd(999)}@example.com`,
			CITIES[rnd(CITIES.length)]!,
			`2026-${String(1 + rnd(12)).padStart(2, '0')}-${String(1 + rnd(28)).padStart(2, '0')}`,
			`${rnd(9999)},${String(rnd(100)).padStart(2, '0')} €`,
		]
	})
}

const ssr = (props: { icons: IconData[]; rows?: number; options?: IconOptions }) =>
	render(IconTable, { props: { ...props, rows: makeRows(props.rows ?? 1) } }).body

describe('iconInner', () => {
	it('draws mdi paths filled, with per-path class', () => {
		expect(iconInner(['M1', 'M2'], ['a', 'b'])).toBe(
			'<path d="M1" fill="currentColor" class="a"/><path d="M2" fill="currentColor" class="b"/>',
		)
	})

	it('draws a lucide node as is', () => {
		expect(
			iconInner([
				['circle', { cx: 12, cy: 12, r: '1' }],
				['path', { d: 'm15 5 4 4' }],
			]),
		).toBe('<circle cx="12" cy="12" r="1"/><path d="m15 5 4 4"/>')
	})

	it('escapes values and drops bad names (data may come from the DB)', () => {
		expect(iconInner('M1"/><script>x</script>')).toBe(
			'<path d="M1&quot;/&gt;&lt;script&gt;x&lt;/script&gt;" fill="currentColor"/>',
		)
		expect(iconInner([['img src=x onerror', { d: '1' }]])).toBe('')
		expect(iconInner([['path', { 'onload="x"': '1', d: '2' }]])).toBe('<path d="2"/>')
	})

	it('empty data draws nothing', () => {
		expect(iconInner('')).toBe('')
	})
})

describe('spriteInner', () => {
	it('defines the symbol once, then only uses it', () => {
		const set = new Set<string>()
		const first = spriteInner(set, '<path d="M1"/>', '0 0 24 24')
		const second = spriteInner(set, '<path d="M1"/>', '0 0 24 24')
		expect(first).toMatch(
			/^<symbol id="(ffi-\w+)" viewBox="0 0 24 24"><path d="M1"\/><\/symbol><use href="#\1"\/>$/,
		)
		expect(second).toBe(first.slice(first.indexOf('<use')))
	})
})

describe('Icon ssr', () => {
	const icons = [Pencil, Trash2, Eye]

	it('false: sized empty box, no drawing', () => {
		const html = ssr({ icons, rows: 2, options: { ssr: false } })
		expect(html).toContain('width="1rem"')
		expect(html.match(REGEX_PATH)).toBeNull()
	})

	it('sprite (default) outside SvelteKit, no registry: inline', () => {
		const html = ssr({ icons, rows: 2 })
		expect(html.match(REGEX_SYMBOL)).toBeNull()
		expect(html.match(REGEX_PATH)).not.toBeNull()
	})

	it('true: inline, lucide stroke defaults', () => {
		const html = ssr({ icons: [Pencil], options: { ssr: true, strokeWidth: 1.5 } })
		expect(html).toContain('fill="none" stroke="currentColor" stroke-width="1.5"')
		expect(html).toContain('stroke-linecap="round" stroke-linejoin="round"')
		expect(html.match(REGEX_PATH)).toHaveLength(2)
	})

	it('sprite: one symbol per distinct icon, one use per occurrence', () => {
		const html = ssr({ icons, rows: 10, options: { ssr: 'sprite' } })
		expect(html.match(REGEX_SYMBOL)).toHaveLength(3)
		expect(html.match(REGEX_USE)).toHaveLength(30)
	})

	it('mdi paths keep their fill', () => {
		const html = ssr({ icons: [mdiPencil], options: { ssr: true } })
		expect(html).toContain(`<path d="${mdiPencil}" fill="currentColor" class="text-muted"/>`)
		expect(html).not.toContain('stroke=')
	})

	// 200 rows x 3 icons: bytes of the icons only (table without icons subtracted)
	it('measure', () => {
		const rows = 200
		const size = (html: string) => ({
			raw: html.length,
			gzip: gzipSync(html).length,
			br: brotliCompressSync(html).length,
		})
		const base = size(ssr({ icons: [], rows }))
		const table: Record<string, { raw: number; gzip: number; br: number }> = {}
		for (const [set, list] of [
			['lucide', [Pencil, Trash2, Eye]],
			['mdi', [mdiPencil, mdiDelete, mdiEye]],
		] as const) {
			for (const mode of [false, 'sprite', true] as const) {
				const s = size(ssr({ icons: [...list], rows, options: { ssr: mode } }))
				table[`${set} ssr=${mode}`] = {
					raw: s.raw - base.raw,
					gzip: s.gzip - base.gzip,
					br: s.br - base.br,
				}
			}
		}
		// NODE_ENV=production ICON_MEASURE=1 vitest run --project node icon.spec --silent=false
		if (process.env.ICON_MEASURE) console.info(JSON.stringify({ base, table }, null, 1))
		const perIcon = (k: string) => table[k]!.raw / (rows * 3)
		for (const set of ['lucide', 'mdi']) {
			expect(perIcon(`${set} ssr=sprite`) - perIcon(`${set} ssr=false`)).toBeLessThan(60)
			expect(perIcon(`${set} ssr=sprite`)).toBeLessThan(perIcon(`${set} ssr=true`) / 1.5)
		}
	})
})
