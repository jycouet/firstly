import { describe, expect, it } from 'vitest'

import { getStyle } from './cellConfig.js'

describe('getStyle', () => {
	it('emits width/flex/order and maps MiddleRight to flex-end + center', () => {
		const s = getStyle({ width: 50, order: 2, align: 'MiddleRight' })
		expect(s).toContain('width: 50%')
		expect(s).toContain('flex: 0 0 50%')
		expect(s).toContain('order: 2')
		expect(s).toContain('justify-content: flex-end')
		expect(s).toContain('align-items: center')
	})

	it('omits justify/align when align is undefined', () => {
		const s = getStyle({ width: 100, order: 1 })
		expect(s).not.toContain('justify-content')
		expect(s).not.toContain('align-items')
	})
})
