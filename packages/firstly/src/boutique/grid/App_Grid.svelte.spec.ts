import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import GridProvide from './_test/GridProvide.svelte'
import TestInput from './_test/TestInput.svelte'
import App_Grid from './App_Grid.svelte'

@Entity('grid_row', { allowApiCrud: true, defaultOrderBy: { order: 'asc' } })
class Row {
	@Fields.id() id = ''
	@Fields.number() order = 0
	@Fields.string({ caption: 'Name' }) name = ''
}

@Entity('grid_link_row', { allowApiCrud: true })
class LinkRow {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Ref', href: (r: LinkRow) => `/x/${r.id}` }) ref = ''
}

// Numeric primary key (e.g. an auto-increment id) - id is NOT a string.
@Entity('grid_num_row', { allowApiCrud: true })
class NumRow {
	@Fields.autoIncrement() id = 0
	@Fields.string({ caption: 'Name' }) name = ''
}

// Composite primary key - the entity has NO single `id` field at all.
@Entity<CompRow>('grid_comp_row', { allowApiCrud: true, id: { a: true, b: true } })
class CompRow {
	@Fields.string() a = ''
	@Fields.string() b = ''
	@Fields.string({ caption: 'Label' }) label = ''
}

// Entity-level `hub`: columns (+ a non-sortable column) come from the entity, no props.
@Entity<HubRow>('grid_hub_row', {
	allowApiCrud: true,
	hub: { cells: ['name', { col: 'order', sortable: false }] },
})
class HubRow {
	@Fields.id() id = ''
	@Fields.number() order = 0
	@Fields.string({ caption: 'Name' }) name = ''
}

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

async function mountGrid(props: Record<string, unknown>) {
	target = document.createElement('div')
	document.body.appendChild(target)

	const comp = mount(App_Grid, { target, props: props as any })
	await vi.waitFor(() => expect(target.querySelector('tbody tr td[data-col]')).not.toBeNull())
	return comp
}

describe('App_Grid', () => {
	it('renders a header per column (caption from metadata) and a row per item', async () => {
		await repo(Row).insert([
			{ order: 1, name: 'a' },
			{ order: 2, name: 'b' },
		])
		const comp = await mountGrid({ entity: Row, cells: ['order', 'name'] })
		const headers = Array.from(target.querySelectorAll('thead th'), (t) => t.textContent?.trim())
		expect(headers).toContain('Name')
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})

	it('renders a field_link cell as an <a href>', async () => {
		await repo(LinkRow).insert({ id: 'abc', ref: 'see' })
		const comp = await mountGrid({ entity: LinkRow, cells: ['ref'] })
		const a = target.querySelector('tbody a[data-ff-link]') as HTMLAnchorElement
		expect(a).toBeTruthy()
		expect(a.getAttribute('href')).toBe('/x/abc')
		expect(a.textContent).toBe('see')
		unmount(comp)
	})

	it('works with a numeric primary key (id is not a string)', async () => {
		await repo(NumRow).insert([{ name: 'a' }, { name: 'b' }])
		const comp = await mountGrid({ entity: NumRow, cells: ['name'] })
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})

	it('reads columns + per-column sortable from the entity hub (no cells prop)', async () => {
		await repo(HubRow).insert({ name: 'a', order: 1 })
		const comp = await mountGrid({ entity: HubRow })
		const headers = Array.from(target.querySelectorAll('thead th'), (t) => t.textContent?.trim())
		expect(headers).toContain('Name')
		// `order` is hub-marked sortable:false → no data-sortable; `name` is sortable
		expect(target.querySelector('thead th[data-col="name"]')?.hasAttribute('data-sortable')).toBe(
			true,
		)
		expect(target.querySelector('thead th[data-col="order"]')?.hasAttribute('data-sortable')).toBe(
			false,
		)
		unmount(comp)
	})

	it('works with a composite primary key (no single id field)', async () => {
		await repo(CompRow).insert([
			{ a: '1', b: 'x', label: 'first' },
			{ a: '2', b: 'y', label: 'second' },
		])
		const comp = await mountGrid({ entity: CompRow, cells: ['label'] })
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})

	it('opens the create dialog in CREATE mode for a composite PK (Create label, no Delete)', async () => {
		// Regression: a composite-PK new row's getId() is "," (truthy), so inferring create-vs-edit
		// from the id mis-read create as edit. The grid tracks the mode explicitly instead.
		target = document.createElement('div')
		document.body.appendChild(target)
		const comp = mount(GridProvide, {
			target,
			props: { entity: CompRow, input: TestInput, cells: ['label'] },
		})
		await vi.waitFor(() => expect(target.querySelector('[data-ff-grid-new]')).toBeTruthy())
		;(target.querySelector('[data-ff-grid-new]') as HTMLButtonElement).click()
		await vi.waitFor(() => expect(document.querySelector('[data-ff-form]')).toBeTruthy())
		const form = document.querySelector('[data-ff-form]') as HTMLElement
		expect(form.querySelector('[data-primary]')?.textContent).toContain('Create')
		expect(form.querySelector('[data-danger]')).toBeNull()
		unmount(comp)
	})

	it('clicking a header toggles orderBy and re-fetches sorted', async () => {
		await repo(Row).insert([
			{ order: 1, name: 'a' },
			{ order: 2, name: 'b' },
		])
		const comp = await mountGrid({ entity: Row, cells: ['order', 'name'] })
		const firstNameBefore = target.querySelector('tbody tr td[data-col="name"]')?.textContent
		expect(firstNameBefore).toBe('a')
		;(target.querySelector('thead th[data-col="name"]') as HTMLElement).click()
		flushSync()
		;(target.querySelector('thead th[data-col="name"]') as HTMLElement).click() // -> desc
		await vi.waitFor(() =>
			expect(target.querySelector('tbody tr td[data-col="name"]')?.textContent).toBe('b'),
		)
		unmount(comp)
	})
})
