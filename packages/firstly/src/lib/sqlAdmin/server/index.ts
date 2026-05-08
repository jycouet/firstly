import type { SqlDatabase } from 'remult'
import { Module } from 'remult/server'
import { yellow } from '@kitql/helpers'

import { log } from '..'
import { SqlAdminController } from '../SqlAdminController'

export type SqlAdminOptions = {
	/**
	 * Override the SqlDatabase used to execute queries.
	 * Defaults to `SqlDatabase.getDb()` (the active Remult data provider).
	 */
	dp?: () => SqlDatabase | Promise<SqlDatabase>
	/**
	 * The route where you mounted the `<SqlAdmin />` component.
	 * Used only for the AI hint logged on server start.
	 *
	 * @default '/sql/admin'
	 */
	path?: string
}

/**
 * Drop-in SQL admin endpoint + companion `<SqlAdmin />` component (`firstly/sqlAdmin`).
 *
 * Gated by `Roles_SqlAdmin.SqlAdmin_Admin` (or the global `FF_Role.FF_Role_Admin`).
 *
 * @example
 * ```ts
 * import { remultApi } from 'remult/remult-sveltekit'
 * import { sqlAdmin } from 'firstly/sqlAdmin/server'
 *
 * export const api = remultApi({
 *   modules: [sqlAdmin()],
 * })
 * ```
 *
 * Then on any admin route:
 * ```svelte
 * <script>
 *   import { SqlAdmin } from 'firstly/sqlAdmin'
 * </script>
 * <SqlAdmin />
 * ```
 */
export const sqlAdmin: (opts?: SqlAdminOptions) => Module<unknown> = (opts) => {
	const path = opts?.path ?? '/sql/admin'
	return new Module({
		key: 'sqlAdmin',
		controllers: [SqlAdminController],
		initApi: async () => {
			if (opts?.dp) {
				SqlAdminController.dp = await opts.dp()
			}
			log.info(`AI Hint: visit ${yellow(path)} to query raw SQL.`)
		},
	})
}
