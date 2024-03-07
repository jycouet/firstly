import { Temporal } from 'proposal-temporal'

export const offsetedToPlainDate = (dt: Date) => {
	const userTimezoneOffset = dt.getTimezoneOffset() * 60000
	return Temporal.PlainDate.from(new Date(dt.getTime() - userTimezoneOffset).toISOString())
}

/**
 * in `range`, `from` is inclusive and `to` is exclusive
 */
export const isBetween = (
	dt: Temporal.PlainDate,
	range: {
		from: Temporal.PlainDate
		to: Temporal.PlainDate
	},
) => {
	return plainDateCompare(dt, { $gte: range.from, $lt: range.to })
}

export const plainDateCompare = (
	dt: Temporal.PlainDate,
	op: {
		$gt?: Temporal.PlainDate
		/** From */
		$gte?: Temporal.PlainDate
		/** to */
		$lt?: Temporal.PlainDate
		$lte?: Temporal.PlainDate
	},
) => {
	// https://tc39.es/proposal-temporal/docs/plaindate.html#compare

	const gt = op.$gt ? Temporal.PlainDate.compare(op.$gt, dt) <= -1 : true
	const gte = op.$gte ? Temporal.PlainDate.compare(op.$gte, dt) <= 0 : true
	const lt = op.$lt ? Temporal.PlainDate.compare(dt, op.$lt) <= -1 : true
	const lte = op.$lte ? Temporal.PlainDate.compare(dt, op.$lte) <= 0 : true

	return gt && gte && lt && lte
}
