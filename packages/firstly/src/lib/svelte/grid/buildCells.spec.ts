import { describe, expect, it } from 'vitest'

import { Entity, Fields, repo } from 'remult'

import { buildCells, displayCell } from './buildCells.js'

@Entity('bc_item')
class Item {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Title' }) title = ''
	@Fields.number({ ui: { width: 50, align: 'right' } }) amount = 0
	@Fields.string({ href: (row: Item) => `/x/${row.id}` }) ref = ''
	@Fields.createdAt() createdAt = new Date()
}

describe('buildCells', () => {
	const meta = repo(Item).metadata

	it('auto: builds a cell per field, caption from metadata', () => {
		const cells = buildCells(meta)
		const byCol = Object.fromEntries(cells.map((c) => [c.col, c]))
		expect(byCol['title'].caption).toBe('Title')
		expect(byCol['title'].kind).toBe('field')
	})

	it('selected: terse keys + config object, in order', () => {
		const cells = buildCells(meta, ['title', { col: 'amount', class: 'col-span-2' }])
		expect(cells.map((c) => c.col)).toEqual(['title', 'amount'])
		expect(cells[1].class).toBe('col-span-2')
	})

	it('reads % width + align from field ui option (SSoT)', () => {
		const c = buildCells(meta, ['amount'])[0]
		expect(c.ui.width).toBe(50)
		expect(c.align).toBe('right')
	})

	it('href field defaults to field_link kind', () => {
		expect(buildCells(meta, ['ref'])[0].kind).toBe('field_link')
	})

	it('per-cell ui override beats the field option', () => {
		const c = buildCells(meta, [{ col: 'amount', ui: { width: 25 } }])[0]
		expect(c.ui.width).toBe(25)
	})

	it('_spacer makes an empty spacer cell', () => {
		const c = buildCells(meta, [{ col: '_spacer' }])[0]
		expect(c.kind).toBe('spacer')
		expect(c.col).toBeUndefined()
	})

	it('explicit kind wins (slot escape hatch)', () => {
		expect(buildCells(meta, [{ col: 'title', kind: 'slot' }])[0].kind).toBe('slot')
	})
})

describe('displayCell', () => {
	const meta = repo(Item).metadata
	it('uses remult displayValue for a primitive', () => {
		const c = buildCells(meta, ['title'])[0]
		expect(displayCell(c, { title: 'Hello' } as Item)).toBe('Hello')
	})
	it('returns empty string when no field/value', () => {
		const c = buildCells(meta, [{ col: '_spacer' }])[0]
		expect(displayCell(c, {} as Item)).toBe('')
	})
})
