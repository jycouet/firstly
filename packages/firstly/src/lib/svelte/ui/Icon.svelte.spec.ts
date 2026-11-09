import { flushSync, mount, unmount } from 'svelte'
import { afterEach, expect, it } from 'vitest'

import Icon from './Icon.svelte'
import { LibIcon_Edit, LibIcon_Man } from './LibIcon.js'

let target: HTMLElement
afterEach(() => target?.remove())

const setup = (props: Record<string, unknown>) => {
	target = document.createElement('div')
	document.body.appendChild(target)
	const p = $state(props)
	const comp = mount(Icon, { target, props: p })
	return { p, comp, svg: () => target.querySelector('svg')! }
}

it('draws a lucide node with stroke defaults, follows prop changes', () => {
	const { p, comp, svg } = setup({ data: LibIcon_Edit, caption: 'Edit' })
	expect(svg().getAttribute('stroke-width')).toBe('2')
	expect(svg().getAttribute('fill')).toBe('none')
	expect(svg().getAttribute('aria-label')).toBe('Edit')
	expect(svg().querySelectorAll('path')).toHaveLength(2)
	expect(svg().querySelector('path')!.namespaceURI).toBe('http://www.w3.org/2000/svg')

	p.strokeWidth = 1.5
	p.size = 32
	flushSync()
	expect(svg().getAttribute('stroke-width')).toBe('1.5')
	expect(svg().getAttribute('width')).toBe('32')

	p.data = LibIcon_Man
	flushSync()
	expect(svg().hasAttribute('stroke')).toBe(false)
	expect(svg().querySelector('path')!.getAttribute('fill')).toBe('currentColor')
	unmount(comp)
})

it('an <svg> string is resized in a span', () => {
	const { comp } = setup({ data: '<svg width="24" height="24"><circle r="1"/></svg>', size: '2rem' })
	expect(target.querySelector('span > svg')!.getAttribute('width')).toBe('2rem')
	expect(target.querySelector('span')!.getAttribute('aria-hidden')).toBe('true')
	unmount(comp)
})
