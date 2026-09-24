import type { SqlDatabase } from 'remult'

import { enrichSqlError } from '../sqlError'

// A drift apply runs many statements in one transaction: without the statement, a
// bare "could not create unique index" can't be traced back to its table.
export async function execStmt(db: SqlDatabase, sql: string) {
	try {
		return await db.createCommand().execute(sql)
	} catch (err) {
		const enriched = await enrichSqlError(db, err, sql)
		const msg = enriched instanceof Error ? enriched.message : String(enriched)
		throw new Error(`${msg}\n\nWhile running: ${sql.trim()}\nNothing was applied (rolled back).`, {
			cause: err,
		})
	}
}

/** Live `public` tables: an entity's table may never have been created (no migration run yet). */
export async function liveTables(db: SqlDatabase) {
	const res = await db.createCommand().execute(`
		SELECT table_name FROM information_schema.tables
		WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
	`)
	return new Set<string>(res.rows.map((r) => r.table_name))
}
