import { describe, expect, it } from 'vitest'

import type { FieldMetadata } from 'remult'

import { FF_Filter } from './FF_Filter'

const containsWords = FF_Filter.containsWords

// Minimal stand-ins for field metadata: containsWords only reads `.key`.
const f = (key: string) => ({ key }) as FieldMetadata<unknown, unknown>
const name = f('name')
const sesa = f('sesa')

describe('FF_Filter.containsWords', () => {
	it('returns {} for empty / whitespace-only search, or no fields', () => {
		expect(containsWords([name, sesa], '')).toEqual({})
		expect(containsWords([name, sesa], '   ')).toEqual({})
		expect(containsWords([], 'dupont')).toEqual({})
	})

	it('single field: every word must match (AND of contains)', () => {
		expect(containsWords([name], 'dupont marie')).toEqual({
			$and: [{ name: { $contains: 'dupont' } }, { name: { $contains: 'marie' } }],
		})
	})

	it('several fields: each word matches any field (AND of ORs)', () => {
		expect(containsWords([name, sesa], 'dupont marie')).toEqual({
			$and: [
				{ $or: [{ name: { $contains: 'dupont' } }, { sesa: { $contains: 'dupont' } }] },
				{ $or: [{ name: { $contains: 'marie' } }, { sesa: { $contains: 'marie' } }] },
			],
		})
	})

	it('ignores extra spaces between words', () => {
		expect(containsWords([name], '  dupont   marie  ')).toEqual({
			$and: [{ name: { $contains: 'dupont' } }, { name: { $contains: 'marie' } }],
		})
	})
})
