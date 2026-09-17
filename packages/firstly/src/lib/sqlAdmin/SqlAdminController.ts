import { BackendMethod, remult, repo, SqlDatabase, type UserInfo } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'
import {
	SQL_TOKEN_CAPS,
	SQL_TOKEN_TTLS,
	SqlToken,
	SqlTokenCall,
	type SqlTokenCap,
	type SqlTokenTtl,
} from './sqlTokenEntities'

declare module 'remult' {
	export interface RemultContext {
		/** Set when the request authenticated with a live sql token aimed at the exec path. */
		sqlToken?: { id: string; userId: string; caps: SqlTokenCap[] }
		/** A sql-token bearer was sent (valid or not): apps may refuse cookie fallback on it. */
		sqlTokenBearer?: boolean
	}
}

export type SqlResult = { rows: any[]; rowCount: number; took: number }

/** Just enough of `pg.Pool` for the read-only path - no dependency on pg. */
export type SqlTokenPool = {
	connect(): Promise<{
		query(q: string | { text: string; values: unknown[]; queryMode: 'extended' }): Promise<{
			rows?: any[]
		}>
		release(err?: Error | boolean): void
		on(event: 'error', fn: (err: Error) => void): unknown
		off(event: 'error', fn: (err: Error) => void): unknown
	}>
}

export type SqlTokensOptions = {
	/** Which capabilities may be minted. `write` runs SQL as is - keep it out until you need it. */
	caps: SqlTokenCap[]
	/**
	 * Turns the minter's id back into the request user, so the token acts as them
	 * with their live roles (lose admin, tokens die). Without it the token is its
	 * own authority and `remult.user` stays empty.
	 */
	userFromId?: (userId: string) => Promise<UserInfo | undefined>
	/** Raw tokens start with this; it is also how the bearer is recognized. @default 'ffsql_' */
	prefix?: string
	/** Remult's api root, for the path gate. @default '/api' */
	apiPath?: string
	/** @default 30 */
	callLogRetentionDays?: number
	/** Override the pool used by `read` tokens. Defaults to the Postgres pool behind the data provider. */
	pool?: SqlTokenPool
}

export const SQL_ADMINS = [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin]
const CALL_LOG_CMD_MAX = 4000

function getDb() {
	return SqlAdminController.dp ?? SqlDatabase.getDb()
}

/** The pg pool remult wraps. `_getSourceSql` is internal but has been stable since remult 1. */
function poolFrom(db: SqlDatabase): SqlTokenPool {
	const pool = (db as any)._getSourceSql?.()?.pool
	if (typeof pool?.connect !== 'function') {
		throw new Error('sql tokens: `read` needs a Postgres data provider (or tokens.pool)')
	}
	return pool
}

export class SqlAdminController {
	/** Optional override set by the `sqlAdmin()` module's `initApi`. Falls back to `SqlDatabase.getDb()`. */
	static dp?: SqlDatabase
	/** Set by the `sqlAdmin()` module's `initApi`. */
	static options: { tokens?: SqlTokensOptions } = {}

	/**
	 * @param cmd SQL to run.
	 * @param notReadOnly When `false` (default) the query runs inside a
	 *   `READ ONLY` transaction so the database itself rejects any write
	 *   (INSERT/UPDATE/DELETE/DDL). Set `true` only when you deliberately want
	 *   to mutate - the UI gates this behind an explicit checkbox.
	 *
	 * With a sql token the token decides, not the caller: `write` runs as is,
	 * otherwise the read-only path (one statement, extended protocol).
	 */
	@BackendMethod({
		// Console: an admin session. Token: the bearer, and with `userFromId` the
		// minter's live roles must still allow it.
		allowed: () => {
			const o = SqlAdminController.options
			if (remult.context.sqlToken) return o.tokens?.userFromId ? remult.isAllowed(SQL_ADMINS) : true
			return remult.isAllowed(SQL_ADMINS)
		},
		apiPrefix: 'ff/sqlAdmin',
		// Remult wraps BackendMethods in a transaction by default; ours would then be
		// nested ("nested transactions not allowed"), and SELECTs would only work
		// with the writes box ticked. We own the transaction here.
		transactional: false,
	})
	static async exec(cmd: string, notReadOnly = false): Promise<SqlResult> {
		const token = remult.context.sqlToken
		if (token) return SqlAdminController.execAsToken(token, cmd)

		const db = getDb()
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

	private static async execAsToken(
		token: NonNullable<typeof remult.context.sqlToken>,
		cmd: string,
	): Promise<SqlResult> {
		const o = SqlAdminController.options.tokens
		if (!o) throw new Error('sql tokens not enabled')
		const cap: SqlTokenCap = token.caps.includes('write') ? 'write' : 'read'

		const run = async (): Promise<SqlResult> => {
			if (cap === 'write') {
				const start = performance.now()
				const rows = (await getDb().execute(cmd)).rows
				return { rows, rowCount: rows.length, took: performance.now() - start }
			}
			const { readOnlySql } = await import('./server/readOnlySql')
			return readOnlySql(o.pool ?? poolFrom(getDb()), cmd)
		}

		const call = repo(SqlTokenCall).create({
			tokenId: token.id,
			cap,
			cmd: cmd.slice(0, CALL_LOG_CMD_MAX),
		})
		try {
			const res = await run()
			call.rowCount = res.rowCount
			call.tookMs = Math.round(res.took)
			return res
		} catch (err) {
			call.error = err instanceof Error ? err.message : String(err)
			throw err
		} finally {
			await repo(SqlTokenCall).insert(call)
			const days = o.callLogRetentionDays ?? 30
			await repo(SqlTokenCall).deleteMany({
				where: { ts: { $lt: new Date(Date.now() - days * 86_400_000) } },
			})
		}
	}

	/**
	 * Returns the raw token exactly once. Needs a live session: a token can never
	 * mint a token. Revoking is a plain update of `SqlToken.revokedAt`.
	 */
	@BackendMethod({
		allowed: () =>
			!!SqlAdminController.options.tokens && !remult.context.sqlToken && remult.isAllowed(SQL_ADMINS),
		apiPrefix: 'ff/sqlAdmin',
	})
	static async mintToken(name: string, caps: SqlTokenCap[], ttl: SqlTokenTtl): Promise<string> {
		const o = SqlAdminController.options.tokens
		if (!o) throw new Error('sql tokens not enabled (sqlAdmin({ tokens }))')
		const userId = remult.user?.id
		if (!userId) throw new Error('Forbidden')
		const clean = name.trim()
		if (!clean) throw new Error('Name is required')
		const ttlMs = SQL_TOKEN_TTLS[ttl]
		if (!ttlMs) throw new Error('Unknown ttl')
		const unique = [...new Set(caps)]
		if (unique.length === 0) throw new Error('Pick at least one capability')
		for (const cap of unique) {
			if (!SQL_TOKEN_CAPS.includes(cap)) throw new Error(`Unknown capability ${cap}`)
			if (!o.caps.includes(cap)) throw new Error(`${cap} is not enabled`)
		}

		const { newRawToken, hashToken, tokenHint } = await import('./server/token')
		const prefix = o.prefix ?? 'ffsql_'
		const raw = newRawToken(prefix)
		await repo(SqlToken).insert({
			name: clean,
			hint: tokenHint(raw, prefix),
			tokenHash: hashToken(raw),
			userId,
			caps: unique,
			expiresAt: new Date(Date.now() + ttlMs),
		})
		return raw
	}
}
