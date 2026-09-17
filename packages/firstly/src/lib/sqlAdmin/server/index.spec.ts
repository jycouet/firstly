import { describe, expect, it } from 'vitest'
import { sqlAdmin } from './index'
describe('sqlAdmin options', () => {
	it('throws on tokens without the controller', () => {
		expect(() => sqlAdmin({ sqlAdmin: false, tokens: { caps: ['read'] } })).toThrow(/exec endpoint/)
	})
	it('registers nothing with sqlAdmin: false', () => {
		expect(sqlAdmin({ sqlAdmin: false }).controllers).toEqual([])
	})
	it('registers entities only with tokens', () => {
		expect(sqlAdmin().entities).toEqual([])
		expect(sqlAdmin({ tokens: { caps: ['read'] } }).entities?.length).toBe(2)
	})
})
