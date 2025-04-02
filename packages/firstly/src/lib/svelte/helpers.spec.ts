import { describe, expect, it } from 'vitest'

import type { FieldMetadata } from 'remult'

import { deepMerge, isOfType, overwriteOptions } from './helpers'

describe('deepMerge', () => {
	it('should merge two simple objects', () => {
		const target = { a: 1, b: 2 }
		const source = { b: 3, c: 4 }

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: 1, b: 3, c: 4 })
		// Original objects should not be modified
		expect(target).toEqual({ a: 1, b: 2 })
	})

	it('should deeply merge nested objects', () => {
		interface TestObject {
			a: number
			nested: {
				x?: number
				y?: number
				z?: number
			}
		}

		const target: TestObject = { a: 1, nested: { x: 10, y: 20 } }
		const source: Partial<TestObject> = { nested: { y: 30, z: 40 } }

		const result = deepMerge(target, source)

		expect(result).toEqual({ a: 1, nested: { x: 10, y: 30, z: 40 } })
	})

	it('should handle undefined source', () => {
		const target = { a: 1, b: 2 }

		const result = deepMerge(target, undefined as any)

		expect(result).toEqual({ a: 1, b: 2 })
	})
})

describe('overwriteOptions', () => {
	it('should merge field options', () => {
		const field = {
			options: {
				caption: 'Original',
				validate: () => undefined,
			},
		} as unknown as FieldMetadata<unknown, unknown>

		const newOptions = {
			caption: 'Updated',
			required: true,
		}

		const result = overwriteOptions(field, newOptions)

		expect(result.options).toEqual({
			caption: 'Updated',
			validate: expect.any(Function),
			required: true,
		})
	})
})

describe('isOfType', () => {
	it('should return true for objects with specified property', () => {
		interface ComponentObject {
			component: string
			props?: Record<string, unknown>
		}

		const componentObj = { component: 'Button', props: { color: 'blue' } }
		const nonComponentObj = 1

		expect(isOfType<ComponentObject>(componentObj, 'component')).toBe(true)
		expect(isOfType<ComponentObject>(nonComponentObj, 'component')).toBe(false)
		expect(isOfType<ComponentObject>(null, 'component')).toBe(false)
	})
})
