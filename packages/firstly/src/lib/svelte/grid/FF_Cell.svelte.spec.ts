import { flushSync, mount, unmount } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'

import FF_Cell_ContextWrapper from './_test/FF_Cell_ContextWrapper.svelte'
import FF_Cell from './FF_Cell.svelte'

let target: HTMLElement
afterEach(() => target?.remove())

function render(props: Record<string, unknown>) {
	target = document.createElement('div')
	document.body.appendChild(target)
	const comp = mount(FF_Cell, { target, props })
	flushSync()
	return { comp, el: target.querySelector('[data-ff-cell]') as HTMLElement }
}

describe('FF_Cell', () => {
	it('applies the % width css var from ui', () => {
		const { comp, el } = render({ ui: { width: 50 } })
		expect(el.style.getPropertyValue('--width')).toBe('50')
		unmount(comp)
	})

	it('renders the label html', () => {
		const { comp, el } = render({ label: { html: 'Name' } })
		expect(el.querySelector('[data-ff-cell-label]')?.textContent).toContain('Name')
		unmount(comp)
	})

	it('renders an error and keeps it visible', () => {
		const { comp, el } = render({ error: { html: 'required' } })
		expect(el.querySelector('[data-ff-cell-error]')?.textContent).toContain('required')
		unmount(comp)
	})
})

describe('FF_Cell context propagation (Part B)', () => {
	it('FF_Config cell.config.label.width propagates to [data-ff-cell-label] inline style', () => {
		const target = document.createElement('div')
		document.body.appendChild(target)
		const comp = mount(FF_Cell_ContextWrapper, { target })
		flushSync()
		const label = target.querySelector('[data-ff-cell-label]') as HTMLElement | null
		expect(label).not.toBeNull()
		const style = label?.getAttribute('style') ?? ''
		// width: 33 from FF_Config should win over the firstly default of 50
		expect(style).toContain('width: 33%')
		unmount(comp)
		target.remove()
	})
})
