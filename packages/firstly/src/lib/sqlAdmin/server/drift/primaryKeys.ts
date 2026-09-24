import { repo, type ClassType, type SqlDatabase } from 'remult'

import { execStmt, liveTables } from './catalog'
import { stripIdent, tableKey, tableKeySql, USER_SCHEMA_SQL } from './ident'
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
		SELECT ${tableKeySql('tc.table_schema', 'tc.table_name')} AS table_key,
			tc.constraint_name, kcu.column_name
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu
			ON tc.constraint_name = kcu.constraint_name
			AND tc.table_schema = kcu.table_schema
		WHERE tc.constraint_type = 'PRIMARY KEY'
			AND ${USER_SCHEMA_SQL('tc.table_schema')}
		ORDER BY table_key, kcu.ordinal_position;
	`)
	const byTable = new Map<string, PkCurrent>()
	for (const row of res.rows) {
		let cur = byTable.get(row.table_key)
		if (!cur) {
			cur = { table: row.table_key, constraintName: row.constraint_name, cols: [] }
			byTable.set(row.table_key, cur)
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
		desired.push({ table: tableKey(meta.dbName), cols })
	}

	const tables = await liveTables(db)

	const plans = planPkSync([...byTable.values()], desired, tables)

	if (opts?.apply) {
		for (const plan of plans) {
			// Fail-fast: any throw aborts the shared transaction -> full rollback.
			for (const stmt of plan.sql) await execStmt(db, stmt)
		}
	}

	return { applied: opts?.apply ?? false, plans }
}
