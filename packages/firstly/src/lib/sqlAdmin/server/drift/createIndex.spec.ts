import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult } from 'remult'
import { NullSort } from 'remult/internals'

import { formatCreateIndex, nullsFirstDefault, sqlCreateIndex } from './createIndex'

describe('nullsFirstDefault (remult NullSort)', () => {
	afterEach(() => {
		NullSort.order = 'native'
	})

	it('native: Postgres default order, no NULLS FIRST', () => {
		expect(nullsFirstDefault()).toBe(false)
	})

	it('asc NULLS FIRST / desc NULLS LAST: NULLS FIRST', () => {
		NullSort.order = { asc: 'NULLS FIRST', desc: 'NULLS LAST' }
		expect(nullsFirstDefault()).toBe(true)
	})

	it('asc NULLS LAST: no NULLS FIRST', () => {
		NullSort.order = { asc: 'NULLS LAST', desc: 'NULLS FIRST' }
		expect(nullsFirstDefault()).toBe(false)
	})
})

describe('formatCreateIndex (pure)', () => {
	it('builds a single-column index with default double-quote wrapping', () => {
		expect(formatCreateIndex({ name: 'FF_IX_things_name', table: 'things', columns: ['name'] })).toBe(
			'CREATE INDEX "FF_IX_things_name" ON "things" ("name");',
		)
	})

	it('builds a multi-column index', () => {
		expect(
			formatCreateIndex({
				name: 'i',
				table: 'connectedServices',
				columns: ['provider', 'providerUserId'],
			}),
		).toBe('CREATE INDEX "i" ON "connectedServices" ("provider", "providerUserId");')
	})

	it('honours unique / concurrently / ifNotExists', () => {
		expect(
			formatCreateIndex({
				name: 'u',
				table: 't',
				columns: ['a'],
				unique: true,
				concurrently: true,
				ifNotExists: true,
			}),
		).toBe('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "u" ON "t" ("a");')
	})

	it('accepts a custom identifier wrapper', () => {
		expect(
			formatCreateIndex({ name: 'i', table: 't', columns: ['a'], wrap: (s) => `\`${s}\`` }),
		).toBe('CREATE INDEX `i` ON `t` (`a`);')
	})

	it('writes NULLS FIRST on every column', () => {
		expect(formatCreateIndex({ name: 'i', table: 't', columns: ['a', 'b'], nullsFirst: true })).toBe(
			'CREATE INDEX "i" ON "t" ("a" NULLS FIRST, "b" NULLS FIRST);',
		)
	})
})

describe('sqlCreateIndex (entity + fields)', () => {
	beforeEach(() => {
		remult.dataProvider = new InMemoryDataProvider()
	})

	@Entity('idx_things')
	class Thing {
		@Fields.string() id = ''
		@Fields.string() provider = ''
		@Fields.string() providerUserId = ''
		@Fields.string({ allowNull: true }) archivedBy: string | null = null
	}

	it('resolves table + columns from the entity and derives a default name', async () => {
		const sql = await sqlCreateIndex(Thing, ['provider', 'providerUserId'])
		expect(sql).toContain('CREATE INDEX')
		expect(sql).toContain('provider')
		expect(sql).toContain('providerUserId')
		expect(sql).toContain('FF_IX_idx_things_provider_providerUserId')
	})

	it('uses FF_UX prefix + UNIQUE for a unique index', async () => {
		const sql = await sqlCreateIndex(Thing, ['provider'], { unique: true })
		expect(sql).toContain('CREATE UNIQUE INDEX')
		expect(sql).toContain('FF_UX_idx_things_provider')
	})

	it('nullsFirst: NULLS FIRST + _NF only for allowNull fields', async () => {
		const sql = await sqlCreateIndex(Thing, ['provider', 'archivedBy'], { nullsFirst: true })
		expect(sql).toContain('FF_IX_idx_things_provider_archivedBy_NF')
		expect(sql).toContain('archivedBy NULLS FIRST')
		expect(sql).not.toContain('provider NULLS FIRST')
	})

	it('follows NullSort by default; `nullsFirst` overrides', async () => {
		expect(await sqlCreateIndex(Thing, ['archivedBy'])).not.toContain('NULLS FIRST')
		NullSort.order = { asc: 'NULLS FIRST', desc: 'NULLS LAST' }
		try {
			expect(await sqlCreateIndex(Thing, ['archivedBy'])).toContain('archivedBy NULLS FIRST')
			expect(await sqlCreateIndex(Thing, ['archivedBy'], { nullsFirst: false })).not.toContain(
				'NULLS FIRST',
			)
		} finally {
			NullSort.order = 'native'
		}
	})

	it('nullsFirst on NOT NULL fields only: plain index, no _NF', async () => {
		const sql = await sqlCreateIndex(Thing, ['provider'], { nullsFirst: true })
		expect(sql).not.toContain('NULLS FIRST')
		expect(sql).not.toContain('_NF')
	})
})
