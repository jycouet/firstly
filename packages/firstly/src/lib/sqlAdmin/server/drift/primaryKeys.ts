import { repo, type ClassType, type SqlDatabase } from 'remult'

import { stripIdent } from './ident'
import { planPkSync, type PkCurrent, type PkDesired, type PkPlan } from './planPkSync'

/**
 * Audit - and optionally fix - PRIMARY KEY drift between the live DB and each
 * entity's `id` config. Default is a dry run: returns the plan, changes nothing.
 * Pass `{ apply: true }` to run it.
 *
 * Why this is needed: Remult only sets a PK on first table creation and never
 * ALTERs it, so a later `id` change is silently ignored on long-lived DBs.
 *
 * Atomic when called inside a BackendMethod: the whole thing shares that method's
 * transaction, so any failure - e.g. PG 23505 when duplicate keys block a
 * composite PK - rolls back every ALTER; the DB is never left half-migrated.
 * That's also why it's plain `ADD PRIMARY KEY`, not `CONCURRENTLY` (which can't
 * run in a transaction): it briefly locks the touched tables, so treat
 * `apply: true` as a maintenance-window action.
 */
export async function reindexPrimaryKeys(
	db: SqlDatabase,
	entities: ClassType<unknown>[],
	opts?: {
		apply?: boolean
	},
): Promise<{ applied: boolean; plans: PkPlan[] }> {
	// Live PKs from the catalog, columns kept in constraint order.
	const res = await db.createCommand().execute(`
		SELECT tc.table_name, tc.constraint_name, kcu.column_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
		WHERE tc.constraint_type = 'PRIMARY KEY'
			AND tc.table_schema = 'public'
		ORDER BY tc.table_name, kcu.ordinal_position;
	`)
	const byTable = new Map<string, PkCurrent>()
	for (const row of res.rows) {
		let cur = byTable.get(row.table_name)
		if (!cur) {
			cur = { table: row.table_name, constraintName: row.constraint_name, cols: [] }
			byTable.set(row.table_name, cur)
		}
		cur.cols.push(row.column_name)
	}

	// Desired PK per entity, straight from its `id` config.
	const desired: PkDesired[] = []
	for (const ent of entities) {
		const meta = repo(ent).metadata
		if (meta.options.sqlExpression) continue // views: no real table
		const cols = meta.idMetadata.fields.map((f) => stripIdent(f.dbName))
		if (cols.length === 0) continue
		desired.push({ table: stripIdent(meta.dbName), cols })
	}

	const plans = planPkSync([...byTable.values()], desired)

	if (opts?.apply) {
		for (const plan of plans) {
			// Fail-fast: any throw aborts the shared transaction -> full rollback.
			for (const stmt of plan.sql) await db.createCommand().execute(stmt)
		}
	}

	return { applied: opts?.apply ?? false, plans }
}
