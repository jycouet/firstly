import { describe, expect, it } from 'vitest'

import { planPkSync } from './planPkSync'

const live = (...names: string[]) => new Set(names)

describe('planPkSync', () => {
	it('leaves a matching PK untouched', () => {
		const plans = planPkSync(
			[{ table: 'activities', constraintName: 'activities_pkey', cols: ['did', 'rkey'] }],
			[{ table: 'activities', cols: ['did', 'rkey'] }],
			live('activities'),
		)
		expect(plans).toEqual([
			{ table: 'activities', before: ['did', 'rkey'], after: ['did', 'rkey'], action: 'ok', sql: [] },
		])
	})

	it('migrates a drifted PK (drop old, add desired)', () => {
		const plans = planPkSync(
			[{ table: 'gears', constraintName: 'gears_pkey', cols: ['rkey'] }],
			[{ table: 'gears', cols: ['did', 'rkey'] }],
			live('gears'),
		)
		expect(plans).toEqual([
			{
				table: 'gears',
				before: ['rkey'],
				after: ['did', 'rkey'],
				action: 'migrate',
				sql: [
					'ALTER TABLE "gears" DROP CONSTRAINT "gears_pkey";',
					'ALTER TABLE "gears" ADD PRIMARY KEY ("did", "rkey");',
				],
			},
		])
	})

	it('treats column order as significant', () => {
		const plans = planPkSync(
			[{ table: 'follows', constraintName: 'follows_pkey', cols: ['rkey', 'did'] }],
			[{ table: 'follows', cols: ['did', 'rkey'] }],
			live('follows'),
		)
		expect(plans[0].action).toBe('migrate')
	})

	it('adds a PK when the table has none', () => {
		const plans = planPkSync([], [{ table: 'gears', cols: ['did', 'rkey'] }], live('gears'))
		expect(plans).toEqual([
			{
				table: 'gears',
				before: [],
				after: ['did', 'rkey'],
				action: 'create',
				sql: ['ALTER TABLE "gears" ADD PRIMARY KEY ("did", "rkey");'],
			},
		])
	})

	it('emits one plan per table when several entities share a dbName', () => {
		const plans = planPkSync(
			[{ table: 'activities', constraintName: 'activities_pkey', cols: ['did', 'rkey'] }],
			[
				{ table: 'activities', cols: ['did', 'rkey'] },
				{ table: 'activities', cols: ['did', 'rkey'] },
			],
			live('activities'),
		)
		expect(plans.map((p) => p.table)).toEqual(['activities'])
	})

	it('only reports entity-backed tables (ignores extra DB tables)', () => {
		const plans = planPkSync(
			[{ table: 'pg_internal_thing', constraintName: 'x', cols: ['id'] }],
			[{ table: 'gears', cols: ['did', 'rkey'] }],
			live('pg_internal_thing', 'gears'),
		)
		expect(plans.map((p) => p.table)).toEqual(['gears'])
	})

	it('reports an entity whose table was never created as missing, with no SQL', () => {
		const plans = planPkSync([], [{ table: 'gears', cols: ['id'] }], live())
		expect(plans).toEqual([{ table: 'gears', before: [], after: ['id'], action: 'missing', sql: [] }])
	})
})
