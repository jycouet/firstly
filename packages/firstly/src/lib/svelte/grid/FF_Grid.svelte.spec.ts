import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import FF_Grid from './FF_Grid.svelte'

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

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

async function mountGrid(props: Record<string, unknown>) {
	target = document.createElement('div')
	document.body.appendChild(target)

	const comp = mount(FF_Grid, { target, props: props as any })
	await vi.waitFor(() => expect(target.querySelector('tbody tr td[data-col]')).not.toBeNull())
	return comp
}

describe('FF_Grid', () => {
	it('renders a header per column (caption from metadata) and a row per item', async () => {
		await repo(Row).insert([
			{ order: 1, name: 'a' },
			{ order: 2, name: 'b' },
		])
		const comp = await mountGrid({ entity: Row, selected: ['order', 'name'] })
		const headers = Array.from(target.querySelectorAll('thead th'), (t) => t.textContent?.trim())
		expect(headers).toContain('Name')
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})

	it('renders a field_link cell as an <a href>', async () => {
		await repo(LinkRow).insert({ id: 'abc', ref: 'see' })
		const comp = await mountGrid({ entity: LinkRow, selected: ['ref'] })
		const a = target.querySelector('tbody a[data-ff-link]') as HTMLAnchorElement
		expect(a).toBeTruthy()
		expect(a.getAttribute('href')).toBe('/x/abc')
		expect(a.textContent).toBe('see')
		unmount(comp)
	})

	it('clicking a header toggles orderBy and re-fetches sorted', async () => {
		await repo(Row).insert([
			{ order: 1, name: 'a' },
			{ order: 2, name: 'b' },
		])
		const comp = await mountGrid({ entity: Row, selected: ['order', 'name'] })
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
