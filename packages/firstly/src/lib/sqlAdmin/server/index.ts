import { remult, repo, type SqlDatabase } from 'remult'
import { Module } from 'remult/server'
import { yellow } from '@kitql/helpers'

import { log } from '..'
import { SqlAdminController } from '../SqlAdminController'
import { SqlTokenController, type SqlTokensOptions } from '../SqlTokenController'
import { isSqlTokenLive, SqlToken, sqlTokenEntities } from '../sqlTokenEntities'
import { hashToken } from './token'

export type { SqlTokensOptions, SqlTokenPool } from '../SqlTokenController'

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
	/** Register the `<SqlAdmin />` endpoint. @default true */
	console?: boolean
	/**
	 * Bearer tokens that can run SQL from outside a browser session (a script,
	 * an AI on a dev machine). Nothing is registered unless set - no entities,
	 * no endpoints. See `<SqlTokens />`.
	 */
	tokens?: SqlTokensOptions | false
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
 *   modules: [sqlAdmin({ tokens: { caps: ['read'], pool } })],
 * })
 * ```
 *
 * Then on any admin route:
 * ```svelte
 * <script>
 *   import { SqlAdmin, SqlTokens } from 'firstly/sqlAdmin'
 * </script>
 * <SqlAdmin />
 * <SqlTokens />
 * ```
 */
export const sqlAdmin: (opts?: SqlAdminOptions) => Module<unknown> = (opts) => {
	const path = opts?.path ?? '/sql/admin'
	const console = opts?.console ?? true
	const tokens = opts?.tokens || undefined
	const prefix = tokens?.prefix ?? 'ffsql_'
	const sqlPath = `${tokens?.apiPath ?? '/api'}/ff/sqlToken/sql`

	return new Module({
		key: 'sqlAdmin',
		// Before the app's own initRequest, so a bearer is resolved before cookies would be.
		priority: -900,
		entities: tokens ? Object.values(sqlTokenEntities) : [],
		controllers: [...(console ? [SqlAdminController] : []), ...(tokens ? [SqlTokenController] : [])],
		initApi: async () => {
			if (opts?.dp) {
				SqlAdminController.dp = await opts.dp()
			}
			if (tokens) SqlTokenController.options = tokens
			if (console) log.info(`AI Hint: visit ${yellow(path)} to query raw SQL.`)
		},
		initRequest: tokens
			? async (event: any) => {
					const auth: string = event?.request?.headers?.get?.('authorization') ?? ''
					if (!auth.toLowerCase().startsWith('bearer ')) return
					const raw = auth.slice(7).trim()
					if (!raw.startsWith(prefix)) return
					remult.context.sqlTokenBearer = true

					// A dead token, or one aimed outside its caps, authenticates nobody:
					// the request stays anonymous and the target's own `allowed` rejects it.
					const pathname: string | undefined = event?.url?.pathname
					if (pathname !== sqlPath) return
					const row = await repo(SqlToken).findFirst({ tokenHash: hashToken(raw) })
					if (!row || !isSqlTokenLive(row)) return

					// Throttled: this runs on every token request.
					if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
						await repo(SqlToken).update(row, { lastUsedAt: new Date() })
					}
					remult.context.sqlToken = { id: row.id, userId: row.userId, caps: row.caps }
					if (tokens.userFromId) remult.user = await tokens.userFromId(row.userId)
				}
			: undefined,
	})
}
