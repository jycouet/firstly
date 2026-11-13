import { beforeEach, describe, expect, it } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, Relations, remult } from 'remult'

import type { NullSortOrder } from './createIndex'
import { planRelationIndexes, relationIndexTargets, type ExistingIndex } from './relationIndexes'

const NF: NullSortOrder = { asc: 'NULLS FIRST', desc: 'NULLS LAST' }
const existing = (entries: Record<string, ExistingIndex[]>) => new Map(Object.entries(entries))
const live = (...names: string[]) => new Set(names)

describe('planRelationIndexes', () => {
	it('skips a relation already covered by an index leftmost prefix (e.g. PK)', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did'], nullable: [true] }],
			existing({
				activities: [{ name: 'activities_pkey', cols: ['did', 'rkey'], nullsFirst: [false, false] }],
			}),
			live('activities'),
		)
		expect(plans).toEqual([
			{
				table: 'activities',
				columns: ['did'],
				name: 'FF_IX_activities_did',
				action: 'ok',
				coveredBy: 'activities_pkey',
				sql: null,
			},
		])
	})

	it('plans an index when no existing index covers the FK columns', () => {
		const plans = planRelationIndexes(
			[{ table: 'follows', columns: ['subject'], nullable: [true] }],
			existing({
				follows: [{ name: 'follows_pkey', cols: ['did', 'rkey'], nullsFirst: [false, false] }],
			}),
			live('follows'),
		)
		expect(plans).toEqual([
			{
				table: 'follows',
				columns: ['subject'],
				name: 'FF_IX_follows_subject',
				action: 'create',
				coveredBy: null,
				sql: 'CREATE INDEX IF NOT EXISTS "FF_IX_follows_subject" ON "follows" ("subject"); DROP INDEX IF EXISTS "FF_IX_follows_subject_NF";',
			},
		])
	})

	it('treats a composite FK as uncovered when the PK prefix diverges', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did', 'gearRkey'], nullable: [true, true] }],
			existing({
				activities: [{ name: 'activities_pkey', cols: ['did', 'rkey'], nullsFirst: [false, false] }],
			}),
			live('activities'),
		)
		expect(plans[0].action).toBe('create')
		expect(plans[0].name).toBe('FF_IX_activities_did_gearRkey')
	})

	it('dedupes identical (table, columns) relations', () => {
		const plans = planRelationIndexes(
			[
				{ table: 'follows', columns: ['subject'], nullable: [true] },
				{ table: 'follows', columns: ['subject'], nullable: [true] },
			],
			existing({}),
			live('follows'),
		)
		expect(plans).toHaveLength(1)
	})

	it('reports a relation on a table that was never created as missing, with no SQL', () => {
		const plans = planRelationIndexes(
			[{ table: 'gears', columns: ['did'], nullable: [true] }],
			existing({}),
			live(),
		)
		expect(plans[0]).toMatchObject({ action: 'missing', sql: null })
	})

	it('counts an exact-match existing index as covering', () => {
		const plans = planRelationIndexes(
			[{ table: 'coachings', columns: ['athleteDid'], nullable: [true] }],
			existing({
				coachings: [{ name: 'FF_IX_coachings_athleteDid', cols: ['athleteDid'], nullsFirst: [false] }],
			}),
			live('coachings'),
		)
		expect(plans[0].action).toBe('ok')
		expect(plans[0].coveredBy).toBe('FF_IX_coachings_athleteDid')
	})

	it('with NULLS FIRST, a default-order index does not cover: plans a NULLS FIRST one', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did'], nullable: [true] }],
			existing({
				activities: [{ name: 'activities_pkey', cols: ['did', 'rkey'], nullsFirst: [false, false] }],
			}),
			live('activities'),
			{ nullSort: NF },
		)
		expect(plans[0]).toMatchObject({
			action: 'create',
			name: 'FF_IX_activities_did_NF',
			sql: 'CREATE INDEX IF NOT EXISTS "FF_IX_activities_did_NF" ON "activities" ("did" NULLS FIRST); DROP INDEX IF EXISTS "FF_IX_activities_did";',
		})
	})

	it('with NULLS FIRST, a NULLS FIRST index covers', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did'], nullable: [true] }],
			existing({ activities: [{ name: 'ix', cols: ['did'], nullsFirst: [true] }] }),
			live('activities'),
			{ nullSort: NF },
		)
		expect(plans[0]).toMatchObject({ action: 'ok', coveredBy: 'ix' })
	})

	it('natively, a NULLS FIRST index does not cover', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did'], nullable: [true] }],
			existing({ activities: [{ name: 'ix', cols: ['did'], nullsFirst: [true] }] }),
			live('activities'),
		)
		expect(plans[0].action).toBe('create')
	})

	it('with NULLS FIRST, a NOT NULL column keeps the default order and any order covers', () => {
		const desired = [{ table: 'activities', columns: ['did'], nullable: [false] }]
		const covered = planRelationIndexes(
			desired,
			existing({ activities: [{ name: 'ix', cols: ['did'], nullsFirst: [false] }] }),
			live('activities'),
			{ nullSort: NF },
		)
		expect(covered[0]).toMatchObject({ action: 'ok', coveredBy: 'ix' })

		const planned = planRelationIndexes(desired, existing({}), live('activities'), {
			nullSort: NF,
		})
		expect(planned[0]).toMatchObject({
			name: 'FF_IX_activities_did',
			sql: 'CREATE INDEX IF NOT EXISTS "FF_IX_activities_did" ON "activities" ("did");',
		})
	})

	it('with NULLS FIRST, only nullable columns of a composite FK get NULLS FIRST', () => {
		const plans = planRelationIndexes(
			[{ table: 't', columns: ['a', 'b'], nullable: [false, true] }],
			existing({}),
			live('t'),
			{ nullSort: NF },
		)
		expect(plans[0].sql).toBe(
			'CREATE INDEX IF NOT EXISTS "FF_IX_t_a_b_NF" ON "t" ("a", "b" NULLS FIRST); DROP INDEX IF EXISTS "FF_IX_t_a_b";',
		)
	})
})

@Entity('rt_parents')
class RtParent {
	@Fields.string() id = ''
}

@Entity('rt_children')
class RtChild {
	@Fields.string() id = ''
	@Fields.string() parentId = ''
	@Relations.toOne(() => RtParent, { field: 'parentId' }) parent?: RtParent
	@Fields.string({ sqlExpression: () => '(SELECT "id" FROM "rt_parents" LIMIT 1)' })
	computedParentId = ''
	@Relations.toOne(() => RtParent, { field: 'computedParentId' }) computedParent?: RtParent
	@Fields.string({ allowNull: true }) optParentId: string | null = null
	@Relations.toOne(() => RtParent, { field: 'optParentId' }) optParent?: RtParent
}

describe('relationIndexTargets', () => {
	beforeEach(() => {
		remult.dataProvider = new InMemoryDataProvider()
	})

	it('skips relations keyed on a computed field (no column to index)', async () => {
		expect(await relationIndexTargets([RtChild])).toEqual([
			{ table: 'rt_children', columns: ['parentId'], nullable: [false] },
			{ table: 'rt_children', columns: ['optParentId'], nullable: [true] },
		])
	})
})
