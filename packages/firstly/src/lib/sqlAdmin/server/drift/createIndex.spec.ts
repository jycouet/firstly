import { beforeEach, describe, expect, it } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult } from 'remult'

import { formatCreateIndex, sqlCreateIndex } from './createIndex'

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
})
