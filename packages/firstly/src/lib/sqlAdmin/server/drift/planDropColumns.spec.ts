import { describe, expect, it } from 'vitest'

import { planDropColumns } from './planDropColumns'

describe('planDropColumns', () => {
	it('flags a live column with no matching entity field', () => {
		const plans = planDropColumns(
			[{ table: 'gears', columns: ['did', 'rkey', 'createdAt'] }],
			[{ table: 'gears', columns: ['did', 'rkey'] }],
		)
		expect(plans).toEqual([{ table: 'gears', column: 'createdAt' }])
	})

	it('keeps a column present in both', () => {
		const plans = planDropColumns(
			[{ table: 'gears', columns: ['did', 'rkey'] }],
			[{ table: 'gears', columns: ['did', 'rkey'] }],
		)
		expect(plans).toEqual([])
	})

	it('leaves alone a table that has no backing entity', () => {
		const plans = planDropColumns(
			[{ table: 'oauth_state', columns: ['id', 'createdAt'] }],
			[{ table: 'gears', columns: ['did', 'rkey'] }],
		)
		expect(plans).toEqual([])
	})

	it('reports several orphans across tables, sorted by table then column', () => {
		const plans = planDropColumns(
			[
				{ table: 'activities', columns: ['did', 'rkey', 'updatedAt', 'createdAt'] },
				{ table: 'gears', columns: ['did', 'rkey', 'createdAt'] },
			],
			[
				{ table: 'activities', columns: ['did', 'rkey'] },
				{ table: 'gears', columns: ['did', 'rkey'] },
			],
		)
		expect(plans).toEqual([
			{ table: 'activities', column: 'createdAt' },
			{ table: 'activities', column: 'updatedAt' },
			{ table: 'gears', column: 'createdAt' },
		])
	})

	it('treats a known table with no live row as nothing to drop', () => {
		const plans = planDropColumns([], [{ table: 'gears', columns: ['did', 'rkey'] }])
		expect(plans).toEqual([])
	})

	it('unions known columns when several entities map to the same table', () => {
		// Several entities may share a table (a light projection + the full row on one
		// `dbName`) - neither alone declares every live column.
		const plans = planDropColumns(
			[{ table: 'activities', columns: ['did', 'rkey', 'name', 'avgHr', 'legacyCol'] }],
			[
				{ table: 'activities', columns: ['did', 'rkey', 'name'] },
				{ table: 'activities', columns: ['did', 'rkey', 'avgHr'] },
			],
		)
		expect(plans).toEqual([{ table: 'activities', column: 'legacyCol' }])
	})
})
