import { Temporal } from '@js-temporal/polyfill'

import { logRemultKit } from '../'

export const dateISOToPlainDate = (iso: string) => {
  try {
    const ti = Temporal.Instant.from(iso)
    return ti.toZonedDateTimeISO('UTC').toPlainDate()
  } catch (error) {
    const msg = `fn dateISOToPlainDate -> "${iso}" is not valid iso`
    logRemultKit.error(msg)
    throw new Error(msg)
  }
}

export const offsetedToPlainDate = (dt: Date) => {
  const userTimezoneOffset = dt.getTimezoneOffset() * 60000
  const adjustedDate = new Date(dt.getTime() - userTimezoneOffset)
  const ti = Temporal.Instant.from(adjustedDate.toISOString())
  return ti.toZonedDateTimeISO('UTC').toPlainDate()
}

export type KitPlainDateRange = {
  from: Temporal.PlainDate
  to: Temporal.PlainDate
}

/**
 * in `range`, `from` is inclusive and `to` is exclusive
 */
export const isBetween = (dt: Temporal.PlainDate, range: KitPlainDateRange) => {
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
