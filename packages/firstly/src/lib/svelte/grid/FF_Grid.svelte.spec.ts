import { mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import FF_Grid from './FF_Grid.svelte'

@Entity('pub_grid_row', { allowApiCrud: true })
class Row {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Name' }) name = ''
}

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

describe('FF_Grid (published, batteries-included)', () => {
	it('renders rows with ZERO setup — no <FF_Config>, no registered input', async () => {
		await repo(Row).insert([{ name: 'a' }, { name: 'b' }])
		target = document.createElement('div')
		document.body.appendChild(target)
		// mounted bare: ffConfig() falls back to defaults, the grid bundles its own input + skin.
		const comp = mount(FF_Grid, { target, props: { entity: Row, cells: ['name'] } as never })
		await vi.waitFor(() => expect(target.querySelector('tbody tr td[data-col]')).not.toBeNull())
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})
})
