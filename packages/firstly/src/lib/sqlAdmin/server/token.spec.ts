import { describe, expect, it } from 'vitest'

import { hashToken, newRawToken, randomTokenName, tokenHint } from './token'

const NAME = /^[a-z]+-[a-z]+-[0-9a-f]{3}$/

describe('token', () => {
	it('hints at the raw token without storing it', () => {
		const raw = newRawToken('ffsql_')
		expect(raw.startsWith('ffsql_')).toBe(true)
		expect(tokenHint(raw, 'ffsql_')).toBe(raw.slice(0, 14))
		expect(hashToken(raw)).toHaveLength(64)
		expect(hashToken(raw)).not.toContain(raw)
	})

	it('names a token adjective-animal-hex', () => {
		expect(randomTokenName()).toMatch(NAME)
		const many = new Set(Array.from({ length: 50 }, randomTokenName))
		expect(many.size).toBeGreaterThan(40)
	})
})
