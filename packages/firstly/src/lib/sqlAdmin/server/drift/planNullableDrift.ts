/**
 * Pure planner: find columns whose entity says `allowNull` but whose live column is
 * still `not null default <empty>`. No DB access here; the executor feeds it the
 * catalog snapshot + the metadata-derived target, and runs the selected subset.
 *
 * Why this exists: `ensureSchema` emits `default '' not null` (or `0` / `false`) for a
 * field that is not `allowNull`, and never relaxes that constraint afterwards. So a
 * column added before the field learned `allowNull` keeps handing every pre-existing
 * row a value outside its own domain, forever - and the entity now claims those rows
 * are null. This is the inverse of `planDropColumns`: nothing is deleted, but rewriting
 * values is destructive enough that the UI selects nothing by default.
 */

/** A live column's constraint state, from the catalog. */
export type LiveColumn = {
	table: string
	column: string
	isNullable: boolean
	hasDefault: boolean
	/** `''` for text-ish columns, null when the empty value cannot be rewritten safely. */
	emptyLiteral: string | null
}

/** What an entity field declares about nullability. */
export type DeclaredColumn = { table: string; column: string; allowNull: boolean }

/** One column to relax, and whether its empty rows can be blanked to NULL. */
export type NullablePlan = {
	table: string
	column: string
	dropNotNull: boolean
	dropDefault: boolean
	/**
	 * false when the column's empty value is a real one (`0`, `false`): the constraint
	 * is relaxed so future writes can be null, but existing rows are left alone rather
	 * than guessing that a zero meant "unset".
	 */
	blankToNull: boolean
}

/**
 * One entry per drifted column. Only columns declared by an entity are considered -
 * a live column with no field is the orphan flow's business, not this one. Sorted by
 * table, then column.
 */
export function planNullableDrift(current: LiveColumn[], known: DeclaredColumn[]): NullablePlan[] {
	const nullableByKey = new Map(
		known.filter((k) => k.allowNull).map((k) => [`${k.table}.${k.column}`, true]),
	)

	const plans: NullablePlan[] = []
	for (const col of current) {
		if (!nullableByKey.has(`${col.table}.${col.column}`)) continue
		if (col.isNullable && !col.hasDefault) continue // already clean
		plans.push({
			table: col.table,
			column: col.column,
			dropNotNull: !col.isNullable,
			dropDefault: col.hasDefault,
			blankToNull: col.emptyLiteral !== null,
		})
	}

	return plans.sort((a, b) => a.table.localeCompare(b.table) || a.column.localeCompare(b.column))
}
