import { describe, expect, it } from 'vitest'

import { decodeSqlWire, encodeSqlWire, isSqlWire } from './sqlWire'

describe('sqlWire', () => {
	it('round-trips unicode and quotes', () => {
		const sql = `select 'héllo 👋', "createdAt" from users where a <> 'b'`
		const wire = encodeSqlWire(sql)
		expect(isSqlWire(wire)).toBe(true)
		expect(wire).not.toMatch(/select|from/i)
		expect(decodeSqlWire(wire)).toBe(sql)
	})
	it('passes plain sql through', () => {
		expect(decodeSqlWire('select 1')).toBe('select 1')
		expect(isSqlWire('select 1')).toBe(false)
	})
	it('matches node base64, which the ff-sql bin uses', () => {
		const s = 'select ~~~ ??? >>> from ü'
		expect(encodeSqlWire(s)).toBe('ffsql1:' + Buffer.from(s).toString('base64'))
	})
	it('handles payloads larger than one chunk', () => {
		const big = JSON.stringify({ rows: Array.from({ length: 20_000 }, (_, i) => ({ i, s: 'é' })) })
		expect(decodeSqlWire(encodeSqlWire(big))).toBe(big)
	})
})
