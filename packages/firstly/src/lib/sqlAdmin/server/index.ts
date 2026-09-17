import { remult, repo, type SqlDatabase } from 'remult'
import { Module } from 'remult/server'
import { yellow } from '@kitql/helpers'

import { log } from '..'
import { SqlAdminController, type SqlTokensOptions } from '../SqlAdminController'
import { isSqlTokenLive, SqlToken, sqlTokenEntities } from '../sqlTokenEntities'
import { hashToken } from './token'

export type { SqlTokensOptions, SqlTokenPool } from '../SqlAdminController'

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
	/**
	 * Register the `SqlAdminController` (the `exec` endpoint behind `<SqlAdmin />`).
	 * `false` registers nothing - and is an error combined with `tokens`, which
	 * run through that same endpoint.
	 *
	 * @default true
	 */
	sqlAdmin?: boolean
	/**
	 * Bearer tokens that can run SQL from outside a browser session (a script,
	 * an AI on a dev machine). Nothing is registered unless set - no entities,
	 * no mint endpoint, no request hook. Needs `sqlAdmin: true`. See `<SqlTokens />`.
	 */
	tokens?: SqlTokensOptions | false
}

// Framework-agnostic: remult hands initRequest the native request (SvelteKit
// RequestEvent, express req, a fetch Request...).
function readAuthorization(req: any): string {
	const h = req?.request?.headers ?? req?.headers
	if (!h) return ''
	if (typeof h.get === 'function') return h.get('authorization') ?? ''
	return h.authorization ?? h.Authorization ?? ''
}
function readPathname(req: any): string {
	if (typeof req?.url?.pathname === 'string') return req.url.pathname
	const u = req?.request?.url ?? req?.originalUrl ?? req?.url ?? req?.path ?? ''
	try {
		return new URL(u, 'http://localhost').pathname
	} catch {
		return ''
	}
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
 *   modules: [sqlAdmin({ tokens: { caps: ['read'] } })],
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
	const enabled = opts?.sqlAdmin ?? true
	const tokens = opts?.tokens || undefined
	if (tokens && !enabled) {
		throw new Error('sqlAdmin({ sqlAdmin: false, tokens }): tokens run through the exec endpoint')
	}
	const prefix = tokens?.prefix ?? 'ffsql_'
	const execPath = `${tokens?.apiPath ?? '/api'}/ff/sqlAdmin/exec`

	return new Module({
		key: 'sqlAdmin',
		// Before the app's own initRequest, so a bearer is resolved before cookies would be.
		priority: -900,
		entities: tokens ? Object.values(sqlTokenEntities) : [],
		controllers: enabled ? [SqlAdminController] : [],
		initApi: async () => {
			if (opts?.dp) {
				SqlAdminController.dp = await opts.dp()
			}
			SqlAdminController.options = { tokens }
			if (enabled) log.info(`AI Hint: visit ${yellow(path)} to query raw SQL.`)
		},
		initRequest: tokens
			? async (req) => {
					const auth = readAuthorization(req)
					if (!auth.toLowerCase().startsWith('bearer ')) return
					const raw = auth.slice(7).trim()
					if (!raw.startsWith(prefix)) return
					remult.context.sqlTokenBearer = true

					// A dead token, or one aimed anywhere but exec, authenticates nobody:
					// the request stays anonymous and the target's own `allowed` rejects it.
					if (readPathname(req) !== execPath) return
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
