import { beforeEach, describe, expect, it } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, Relations, remult } from 'remult'

import { planRelationIndexes, relationIndexTargets, type ExistingIndex } from './relationIndexes'

const existing = (entries: Record<string, ExistingIndex[]>) => new Map(Object.entries(entries))
const live = (...names: string[]) => new Set(names)

describe('planRelationIndexes', () => {
	it('skips a relation already covered by an index leftmost prefix (e.g. PK)', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did'] }],
			existing({ activities: [{ name: 'activities_pkey', cols: ['did', 'rkey'] }] }),
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
			[{ table: 'follows', columns: ['subject'] }],
			existing({ follows: [{ name: 'follows_pkey', cols: ['did', 'rkey'] }] }),
			live('follows'),
		)
		expect(plans).toEqual([
			{
				table: 'follows',
				columns: ['subject'],
				name: 'FF_IX_follows_subject',
				action: 'create',
				coveredBy: null,
				sql: 'CREATE INDEX IF NOT EXISTS "FF_IX_follows_subject" ON "follows" ("subject");',
			},
		])
	})

	it('treats a composite FK as uncovered when the PK prefix diverges', () => {
		const plans = planRelationIndexes(
			[{ table: 'activities', columns: ['did', 'gearRkey'] }],
			existing({ activities: [{ name: 'activities_pkey', cols: ['did', 'rkey'] }] }),
			live('activities'),
		)
		expect(plans[0].action).toBe('create')
		expect(plans[0].name).toBe('FF_IX_activities_did_gearRkey')
	})

	it('dedupes identical (table, columns) relations', () => {
		const plans = planRelationIndexes(
			[
				{ table: 'follows', columns: ['subject'] },
				{ table: 'follows', columns: ['subject'] },
			],
			existing({}),
			live('follows'),
		)
		expect(plans).toHaveLength(1)
	})

	it('reports a relation on a table that was never created as missing, with no SQL', () => {
		const plans = planRelationIndexes([{ table: 'gears', columns: ['did'] }], existing({}), live())
		expect(plans[0]).toMatchObject({ action: 'missing', sql: null })
	})

	it('counts an exact-match existing index as covering', () => {
		const plans = planRelationIndexes(
			[{ table: 'coachings', columns: ['athleteDid'] }],
			existing({ coachings: [{ name: 'FF_IX_coachings_athleteDid', cols: ['athleteDid'] }] }),
			live('coachings'),
		)
		expect(plans[0].action).toBe('ok')
		expect(plans[0].coveredBy).toBe('FF_IX_coachings_athleteDid')
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
}

describe('relationIndexTargets', () => {
	beforeEach(() => {
		remult.dataProvider = new InMemoryDataProvider()
	})

	it('skips relations keyed on a computed field (no column to index)', async () => {
		expect(await relationIndexTargets([RtChild])).toEqual([
			{ table: 'rt_children', columns: ['parentId'] },
		])
	})
})
