import { repo, type ClassType, type SqlDatabase } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { stripIdent } from './ident'
import {
	planNullableDrift,
	type DeclaredColumn,
	type LiveColumn,
	type NullablePlan,
} from './planNullableDrift'

// Only a text column has an empty value that is unambiguously "unset". A numeric or
// boolean default (0 / false) may be genuine data, so those columns get their
// constraint relaxed and their rows left alone.
const TEXT_TYPES = new Set(['character varying', 'text', 'character'])

/**
 * Audit - and optionally fix a selected subset of - nullability drift: columns whose
 * entity field says `allowNull` while the live column is still `not null` and/or
 * carries the schema builder's empty default. Default is a dry run.
 *
 * Why this is needed: `ensureSchema` writes `default '' not null` for a non-nullable
 * field and never revisits it, so a column created before its field learned `allowNull`
 * keeps feeding every pre-existing row an empty string the entity now types as null.
 *
 * Applying does up to three things per column, in this order: DROP DEFAULT, DROP NOT
 * NULL, then (text only) rewrite the empty rows to NULL. The rewrite is the destructive
 * part - it cannot distinguish a row that was never written from one deliberately set
 * to '' - which is why the UI ticks nothing by default and the selection is re-checked
 * against a freshly computed plan.
 *
 * Atomic inside a BackendMethod: every statement shares that method's transaction, so
 * any failure rolls them all back.
 */
export async function syncNullable(
	db: SqlDatabase,
	entities: ClassType<unknown>[],
	opts?: {
		apply?: boolean
		columns?: { table: string; column: string }[]
	},
): Promise<{ applied: boolean; plans: NullablePlan[]; fixed: NullablePlan[] }> {
	// What each entity declares about nullability, straight from metadata.
	const known: DeclaredColumn[] = []
	for (const ent of entities) {
		const meta = repo(ent).metadata
		if (meta.options.sqlExpression) continue // views: no real table
		const table = stripIdent(meta.dbName)
		for (const field of meta.fields.toArray()) {
			if (getRelationFieldInfo(field)) continue // FK scalars are declared by their own field
			if (field.options.sqlExpression) continue // computed, no stored column
			known.push({ table, column: stripIdent(field.dbName), allowNull: !!field.options.allowNull })
		}
	}

	const res = await db.createCommand().execute(`
		SELECT table_name, column_name, is_nullable, column_default, data_type
		FROM information_schema.columns
		WHERE table_schema = 'public'
		ORDER BY table_name, ordinal_position;
	`)
	const current: LiveColumn[] = res.rows.map((row) => ({
		table: row.table_name,
		column: row.column_name,
		isNullable: row.is_nullable === 'YES',
		hasDefault: row.column_default != null,
		emptyLiteral: TEXT_TYPES.has(row.data_type) ? "''" : null,
	}))

	const plans = planNullableDrift(current, known)

	let fixed: NullablePlan[] = []
	if (opts?.apply && opts.columns?.length) {
		const drifted = new Map(plans.map((p) => [`${p.table}.${p.column}`, p]))
		// Only fix what is still drifted - the names then come from the catalog, not raw
		// client input, so the interpolated identifiers are trusted.
		fixed = opts.columns
			.map((c) => drifted.get(`${c.table}.${c.column}`))
			.filter((p): p is NullablePlan => !!p)

		for (const p of fixed) {
			const col = `ALTER TABLE "${p.table}" ALTER COLUMN "${p.column}"`
			if (p.dropDefault) await db.createCommand().execute(`${col} DROP DEFAULT;`)
			if (p.dropNotNull) await db.createCommand().execute(`${col} DROP NOT NULL;`)
			if (p.blankToNull) {
				await db
					.createCommand()
					.execute(`UPDATE "${p.table}" SET "${p.column}" = NULL WHERE "${p.column}" = '';`)
			}
		}
	}

	return { applied: opts?.apply ?? false, plans, fixed }
}
