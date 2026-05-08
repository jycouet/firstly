import { BackendMethod, SqlDatabase } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'

export class SqlAdminController {
	/** Optional override set by the `sqlAdmin()` module's `initApi`. Falls back to `SqlDatabase.getDb()`. */
	static dp?: SqlDatabase

	@BackendMethod({ allowed: [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin] })
	static async exec(cmd: string) {
		const db = SqlAdminController.dp ?? SqlDatabase.getDb()
		const start = performance.now()
		const r = await db.execute(cmd)
		const took = performance.now() - start
		return { r, took }
	}
}
