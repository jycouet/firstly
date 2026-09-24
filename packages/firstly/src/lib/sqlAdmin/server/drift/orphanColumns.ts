import { repo, type ClassType, type SqlDatabase } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { stripIdent } from './ident'
import { planDropColumns, type DropPlan, type TableColumns } from './planDropColumns'

/**
 * Audit - and optionally drop a selected subset of - orphan columns: live DB
 * columns on an entity-backed table that no entity field declares. Default is a
 * dry run: returns every orphan, changes nothing.
 *
 * Unlike the PK / relation flows (which apply the whole plan), this one is
 * destructive, so apply takes the explicit `columns` the user ticked and drops
 * only those - re-checking each against a freshly computed orphan set so a stale
 * client can never drop a column that is no longer orphan.
 *
 * Why this is needed: Remult's auto-schema only ever ADDs columns, never drops
 * them, so a field removed from an entity (e.g. a redundant `createdAt` now
 * covered by the FF_Entity changelog) leaves its column behind forever.
 *
 * Atomic inside a BackendMethod: every ALTER shares that method's transaction, so
 * any failure rolls them all back. Plain `DROP COLUMN` (no CASCADE) - a column
 * with a dependency errors loudly rather than silently dropping dependents - which
 * also briefly locks the touched tables, so treat `apply` as a maintenance action.
 */
export async function dropColumns(
	db: SqlDatabase,
	entities: ClassType<unknown>[],
	opts?: {
		apply?: boolean
		columns?: DropPlan[]
	},
): Promise<{ applied: boolean; plans: DropPlan[]; dropped: DropPlan[] }> {
	// Declared columns per entity-backed table, straight from metadata.
	const known: TableColumns[] = []
	for (const ent of entities) {
		const meta = repo(ent).metadata
		if (meta.options.sqlExpression) continue // views: no real table
		const fields = meta.fields.toArray()
		const dbNameByKey = new Map(fields.map((f) => [f.key, stripIdent(f.dbName)]))
		const columns: string[] = []
		for (const field of fields) {
			const fi = getRelationFieldInfo(field)
			if (fi) {
				// A toOne relation's FK columns are real; toMany owns none. The FK keys
				// are usually separate scalar fields too, but resolve them defensively.
				if (fi.type === 'toOne')
					for (const k of Object.values(fi.getFields().fields))
						columns.push(dbNameByKey.get(k) ?? stripIdent(String(k)))
				continue
			}
			if (field.options.sqlExpression) continue // computed, no stored column
			columns.push(stripIdent(field.dbName))
		}
		known.push({ table: stripIdent(meta.dbName), columns })
	}

	// Live columns per table from the catalog, in ordinal order.
	const res = await db.createCommand().execute(`
		SELECT table_name, column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
		ORDER BY table_name, ordinal_position;
	`)
	const liveByTable = new Map<string, string[]>()
	for (const row of res.rows) {
		const list = liveByTable.get(row.table_name) ?? []
		list.push(row.column_name)
		liveByTable.set(row.table_name, list)
	}
	const current: TableColumns[] = Array.from(liveByTable, ([table, columns]) => ({ table, columns }))

	const plans = planDropColumns(current, known)

	let dropped: DropPlan[] = []
	if (opts?.apply && opts.columns?.length) {
		const orphan = new Set(plans.map((p) => `${p.table}.${p.column}`))
		// Only drop what is still orphan - the names then come from the catalog, not
		// raw client input, so the interpolated identifiers are trusted.
		dropped = opts.columns.filter((c) => orphan.has(`${c.table}.${c.column}`))
		for (const { table, column } of dropped) {
			await db.createCommand().execute(`ALTER TABLE "${table}" DROP COLUMN "${column}";`)
		}
	}

	return { applied: opts?.apply ?? false, plans, dropped }
}
