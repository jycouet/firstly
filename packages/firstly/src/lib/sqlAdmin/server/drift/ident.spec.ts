import { describe, expect, it } from 'vitest'

import { quoteTable, tableKey } from './ident'
import { planPkSync } from './planPkSync'

describe('tableKey / quoteTable', () => {
	it('keeps the schema only outside public', () => {
		expect(tableKey('"ff_auth"."ba-accounts"')).toBe('ff_auth.ba-accounts')
		expect(tableKey('public.gears')).toBe('gears')
		expect(tableKey('"gears"')).toBe('gears')
	})

	it('quotes a schema-qualified key as two identifiers', () => {
		expect(quoteTable('ff_auth.ba-accounts')).toBe('"ff_auth"."ba-accounts"')
		expect(quoteTable('gears')).toBe('"gears"')
	})

	it('targets the entity schema, not public, when planning a PK', () => {
		const [plan] = planPkSync(
			[],
			[{ table: 'ff_auth.ba-accounts', cols: ['id'] }],
			new Set(['ff_auth.ba-accounts']),
		)
		expect(plan!.sql).toEqual(['ALTER TABLE "ff_auth"."ba-accounts" ADD PRIMARY KEY ("id");'])
	})
})
