import { BackendMethod, remult, repo, SqlDatabase, type UserInfo } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'
import {
	SQL_CAPABILITIES,
	SQL_TOKEN_TTLS,
	SqlToken,
	SqlTokenCall,
	type SqlCapability,
	type SqlTokenTtl,
} from './sqlTokenEntities'

declare module 'remult' {
	export interface RemultContext {
		/** Set when the request authenticated with a live sql token aimed at the exec path. */
		sqlToken?: { id: string; userId: string; capabilities: SqlCapability[] }
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
	capabilities: SqlCapability[]
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
/** Retention is a housekeeping sweep, not something to pay for on every query. */
const CALL_LOG_SWEEP_EVERY_MS = 3_600_000
let lastCallLogSweep = 0

function getDb() {
	return SqlAdminController.dp ?? SqlDatabase.getDb()
}

/** The pg pool remult wraps, if any. `_getSourceSql` is internal but has been stable since remult 1. */
function poolFrom(db: SqlDatabase): SqlTokenPool | undefined {
	const pool = (db as any)._getSourceSql?.()?.pool
	return typeof pool?.connect === 'function' ? pool : undefined
}

export class SqlAdminController {
	/** Optional override set by the `sqlAdmin()` module's `initApi`. Falls back to `SqlDatabase.getDb()`. */
	static dp?: SqlDatabase
	/** Set by the `sqlAdmin()` module's `initApi`. */
	static options: { tokens?: SqlTokensOptions } = {}

	/**
	 * @param cmd SQL to run.
	 * @param capabilities `['read']` (default) runs inside a `READ ONLY`
	 *   transaction, one statement at a time, so the database itself rejects any
	 *   write (INSERT/UPDATE/DELETE/DDL). Add `'write'` only when you deliberately
	 *   want to mutate - the UI gates this behind an explicit checkbox.
	 *
	 * With a sql token the token decides, not the caller.
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
		// nested ("nested transactions not allowed"). We own the transaction here.
		transactional: false,
	})
	static async exec(cmd: string, capabilities: SqlCapability[] = ['read']): Promise<SqlResult> {
		const token = remult.context.sqlToken
		if (token) return SqlAdminController.execAsToken(token, cmd)
		return SqlAdminController.run(cmd, capabilities)
	}

	private static async run(cmd: string, capabilities: SqlCapability[]): Promise<SqlResult> {
		const db = getDb()
		try {
			// Anything that is not an explicit list (null, a stray boolean) is a read.
			if (Array.isArray(capabilities) && capabilities.includes('write')) {
				const start = performance.now()
				const rows = (await db.execute(cmd)).rows
				return { rows, rowCount: rows.length, took: performance.now() - start }
			}
			const { readOnlySql } = await import('./server/readOnlySql')
			return await readOnlySql(db, SqlAdminController.options.tokens?.pool ?? poolFrom(db), cmd)
		} catch (err) {
			const { enrichSqlError } = await import('./server/sqlError')
			throw await enrichSqlError(db, err, cmd)
		}
	}

	private static async execAsToken(
		token: NonNullable<typeof remult.context.sqlToken>,
		cmd: string,
	): Promise<SqlResult> {
		const o = SqlAdminController.options.tokens
		if (!o) throw new Error('sql tokens not enabled')
		const capability: SqlCapability = token.capabilities.includes('write') ? 'write' : 'read'

		const call = repo(SqlTokenCall).create({
			tokenId: token.id,
			capability,
			cmd: cmd.slice(0, CALL_LOG_CMD_MAX),
		})
		try {
			const res = await SqlAdminController.run(cmd, [capability])
			call.rowCount = res.rowCount
			call.tookMs = Math.round(res.took)
			return res
		} catch (err) {
			call.error = err instanceof Error ? err.message : String(err)
			throw err
		} finally {
			await repo(SqlTokenCall).insert(call)
			if (Date.now() - lastCallLogSweep > CALL_LOG_SWEEP_EVERY_MS) {
				lastCallLogSweep = Date.now()
				const days = o.callLogRetentionDays ?? 30
				await repo(SqlTokenCall).deleteMany({
					where: { ts: { $lt: new Date(Date.now() - days * 86_400_000) } },
				})
			}
		}
	}

	/**
	 * Returns the raw token exactly once. Needs a live session: a token can never
	 * mint a token. Revoking is a plain update of `SqlToken.revokedAt`, deleting
	 * is a plain delete.
	 *
	 * @param name free text, or empty for an `adjective-animal` one.
	 */
	@BackendMethod({
		allowed: () =>
			!!SqlAdminController.options.tokens && !remult.context.sqlToken && remult.isAllowed(SQL_ADMINS),
		apiPrefix: 'ff/sqlAdmin',
	})
	static async mintToken(
		name: string,
		capabilities: SqlCapability[],
		ttl: SqlTokenTtl,
	): Promise<string> {
		const o = SqlAdminController.options.tokens
		if (!o) throw new Error('sql tokens not enabled (sqlAdmin({ tokens }))')
		const userId = remult.user?.id
		if (!userId) throw new Error('Forbidden')
		const ttlMs = SQL_TOKEN_TTLS[ttl]
		if (!ttlMs) throw new Error('Unknown ttl')
		const unique = [...new Set(capabilities)]
		if (unique.length === 0) throw new Error('Pick at least one capability')
		for (const c of unique) {
			if (!SQL_CAPABILITIES.includes(c)) throw new Error(`Unknown capability ${c}`)
			if (!o.capabilities.includes(c)) throw new Error(`${c} is not enabled`)
		}

		const { newRawToken, hashToken, tokenHint, randomTokenName } = await import('./server/token')
		const prefix = o.prefix ?? 'ffsql_'
		const raw = newRawToken(prefix)
		await repo(SqlToken).insert({
			name: name.trim() || randomTokenName(),
			hint: tokenHint(raw, prefix),
			tokenHash: hashToken(raw),
			userId,
			capabilities: unique,
			expiresAt: new Date(Date.now() + ttlMs),
		})
		return raw
	}

	/**
	 * Deletes every token that can no longer be used (expired or revoked), and
	 * their calls. Returns how many were actually deleted: no transaction spans
	 * the loop, so a failure halfway leaves the rest in place.
	 */
	@BackendMethod({
		allowed: () =>
			!!SqlAdminController.options.tokens && !remult.context.sqlToken && remult.isAllowed(SQL_ADMINS),
		apiPrefix: 'ff/sqlAdmin',
	})
	static async purgeTokens(): Promise<number> {
		const dead = await repo(SqlToken).find({
			where: { $or: [{ revokedAt: { $ne: null } }, { expiresAt: { $lt: new Date() } }] },
		})
		// One by one: the cascade to the call log lives in the entity's hooks.
		let deleted = 0
		for (const t of dead) {
			await repo(SqlToken).delete(t)
			deleted++
		}
		return deleted
	}
}
