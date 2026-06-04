import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import Provide from './_test/Provide.svelte'
import TestInput from './_test/TestInput.svelte'

@Entity('form_row', { allowApiCrud: true })
class Row {
	@Fields.id() id = ''
	@Fields.string({ required: true }) name = ''
}

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

describe('App_Group', () => {
	it('renders a cell per field and saves the bound value', async () => {
		await repo(Row).insert({ name: 'init' })
		target = document.createElement('div')
		document.body.appendChild(target)
		const comp = mount(Provide, { target, props: { entity: Row, input: TestInput } })
		await vi.waitFor(() => expect(target.querySelector('input')).toBeTruthy())
		const input = target.querySelector('input') as HTMLInputElement
		input.value = 'updated'
		input.dispatchEvent(new Event('input', { bubbles: true }))
		flushSync()
		;(target.querySelector('[data-ff-form] [data-primary]') as HTMLButtonElement).click()
		await vi.waitFor(async () => expect((await repo(Row).findFirst())?.name).toBe('updated'))
		unmount(comp)
	})
})
