import { BackendMethod, SqlDatabase } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'

export class SqlAdminController {
	/** Optional override set by the `sqlAdmin()` module's `initApi`. Falls back to `SqlDatabase.getDb()`. */
	static dp?: SqlDatabase

	/**
	 * @param cmd SQL to run.
	 * @param notReadOnly When `false` (default) the query runs inside a
	 *   `READ ONLY` transaction so the database itself rejects any write
	 *   (INSERT/UPDATE/DELETE/DDL). Set `true` only when you deliberately want
	 *   to mutate - the UI gates this behind an explicit checkbox.
	 */
	@BackendMethod({ allowed: [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin] })
	static async exec(cmd: string, notReadOnly = false) {
		const db = SqlAdminController.dp ?? SqlDatabase.getDb()
		const start = performance.now()
		let rows: any[] = []
		if (notReadOnly) {
			rows = (await db.execute(cmd)).rows
		} else {
			await db.transaction(async (tx) => {
				const txDb = SqlDatabase.getDb(tx)
				// Postgres: makes the whole transaction reject writes at the DB level.
				await txDb.execute('SET TRANSACTION READ ONLY')
				rows = (await txDb.execute(cmd)).rows
			})
		}
		const took = performance.now() - start
		return { rows, rowCount: rows.length, took }
	}
}
