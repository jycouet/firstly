import { describe, expect, it } from 'vitest'

import { planNullableDrift, type DeclaredColumn, type LiveColumn } from './planNullableDrift'

const live = (p: Partial<LiveColumn> = {}): LiveColumn => ({
	table: 'plans',
	column: 'status',
	isNullable: false,
	hasDefault: true,
	emptyLiteral: "''",
	...p,
})

const declared = (p: Partial<DeclaredColumn> = {}): DeclaredColumn => ({
	table: 'plans',
	column: 'status',
	allowNull: true,
	...p,
})

describe('planNullableDrift', () => {
	it('flags a nullable field whose column is still not-null with a default', () => {
		expect(planNullableDrift([live()], [declared()])).toEqual([
			{ table: 'plans', column: 'status', dropNotNull: true, dropDefault: true, blankToNull: true },
		])
	})

	it('leaves a column that is already plain nullable alone', () => {
		const plans = planNullableDrift([live({ isNullable: true, hasDefault: false })], [declared()])

		expect(plans).toEqual([])
	})

	it('still flags a nullable column that kept its default', () => {
		const plans = planNullableDrift([live({ isNullable: true })], [declared()])

		expect(plans).toEqual([
			{ table: 'plans', column: 'status', dropNotNull: false, dropDefault: true, blankToNull: true },
		])
	})

	it('ignores a column the entity declares NOT NULL - there "" is a real value', () => {
		const plans = planNullableDrift(
			[live({ column: 'title' })],
			[declared({ column: 'title', allowNull: false })],
		)

		expect(plans).toEqual([])
	})

	it('ignores a live column no entity declares (that is the orphan flow)', () => {
		expect(planNullableDrift([live({ column: 'legacy' })], [declared()])).toEqual([])
	})

	it('relaxes the constraint but keeps values when the empty value could be real', () => {
		const plans = planNullableDrift(
			[live({ column: 'rpe', emptyLiteral: null })],
			[declared({ column: 'rpe' })],
		)

		expect(plans).toEqual([
			{ table: 'plans', column: 'rpe', dropNotNull: true, dropDefault: true, blankToNull: false },
		])
	})

	it('sorts by table then column', () => {
		const plans = planNullableDrift(
			[
				live({ table: 'zebra', column: 'b' }),
				live({ table: 'alpha', column: 'z' }),
				live({ table: 'alpha', column: 'a' }),
			],
			[
				declared({ table: 'zebra', column: 'b' }),
				declared({ table: 'alpha', column: 'z' }),
				declared({ table: 'alpha', column: 'a' }),
			],
		)

		expect(plans.map((p) => `${p.table}.${p.column}`)).toEqual(['alpha.a', 'alpha.z', 'zebra.b'])
	})
})
