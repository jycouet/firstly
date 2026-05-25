import { mount, tick, unmount } from 'svelte'
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'

import { dialog, type DialogClose, type DialogResult } from './dialog.svelte'
import DialogOpenTest from './DialogOpenTest.svelte'
import FF_DialogManager from './FF_DialogManager.svelte'

// The store only stores the body/component reference; it never renders here, so a
// no-op snippet/component reference is enough for store-level assertions.
const noopSnippet = (() => {}) as unknown as import('svelte').Snippet<[DialogClose<any>]>

afterEach(() => dialog.closeAll())

describe('dialog.show (render union)', () => {
	it('queues a snippet item and resolves with its result', async () => {
		const p = dialog.show<{ name: string }>(noopSnippet)
		expect(dialog.list.length).toBe(1)
		const item = dialog.list[0]
		expect(item.render.kind).toBe('snippet')

		dialog._close(item.id, { ok: true, data: { name: 'Ada' } })
		await expect(p).resolves.toEqual({ ok: true, data: { name: 'Ada' } })
		expect(dialog.list.length).toBe(0)
	})
})

describe('dialog.open (component)', () => {
	it('queues a component item with its props and resolves typed data', async () => {
		const p = dialog.open(DialogOpenTest, { props: { label: 'Hi' } })
		expect(dialog.list.length).toBe(1)
		const item = dialog.list[0]
		expect(item.render.kind).toBe('component')
		if (item.render.kind === 'component') {
			expect(item.render.component).toBe(DialogOpenTest)
			expect(item.render.props).toEqual({ label: 'Hi' })
		}

		dialog._close(item.id, { ok: true, data: 7 })
		await expect(p).resolves.toEqual({ ok: true, data: 7 })
		expect(dialog.list.length).toBe(0)
	})

	it('props is optional and defaults to {}', () => {
		dialog.open(DialogOpenTest)
		const item = dialog.list[0]
		if (item.render.kind === 'component') expect(item.render.props).toEqual({})
	})

	it('resolves { ok: false } on dismiss', async () => {
		const p = dialog.open(DialogOpenTest, { props: { label: 'x' } })
		await dialog.requestClose(dialog.list[0].id)
		await expect(p).resolves.toEqual({ ok: false })
	})

	it('infers the result type from the component close prop', () => {
		expectTypeOf(dialog.open(DialogOpenTest, { props: { label: 'x' } })).resolves.toEqualTypeOf<
			DialogResult<number>
		>()
	})

	it('renders the component through the manager and resolves on its button', async () => {
		const host = document.createElement('div')
		document.body.appendChild(host)
		const app = mount(FF_DialogManager, { target: host })
		try {
			const p = dialog.open(DialogOpenTest, { props: { label: 'Mounted' } })
			await tick()
			expect(document.querySelector('[data-testid="open-label"]')?.textContent).toBe('Mounted')
			;(document.querySelector('[data-testid="open-ok"]') as HTMLButtonElement).click()
			await expect(p).resolves.toEqual({ ok: true, data: 7 })
		} finally {
			unmount(app)
			host.remove()
		}
	})
})
