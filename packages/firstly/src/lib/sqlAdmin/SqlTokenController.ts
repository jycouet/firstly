import { BackendMethod, remult, repo, type UserInfo } from 'remult'

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
		/** Set when the request authenticated with a live sql token aimed at a path its caps open. */
		sqlToken?: { id: string; userId: string; caps: SqlTokenCap[] }
		/** A sql-token bearer was sent (valid or not): apps may refuse cookie fallback on it. */
		sqlTokenBearer?: boolean
	}
}

export type SqlResult = { rows: any[]; rowCount: number; took: number }

/** Just enough of `pg.Pool` for readOnlySql - no dependency on pg. */
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
	/** `pg.Pool` (or equivalent). Required for `read`: the read-only path needs the extended query protocol. */
	pool?: SqlTokenPool
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
}

const admins = [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin]
const CALL_LOG_CMD_MAX = 4000

export class SqlTokenController {
	/** Set by the `sqlAdmin({ tokens })` module's `initApi`. */
	static options?: SqlTokensOptions

	/** Returns the raw token exactly once. Needs a live session: a token can never mint a token. */
	@BackendMethod({ allowed: admins, apiPrefix: 'ff/sqlToken' })
	static async mint(name: string, caps: SqlTokenCap[], ttl: SqlTokenTtl): Promise<string> {
		const o = SqlTokenController.options
		if (!o) throw new Error('sql tokens not enabled (sqlAdmin({ tokens }))')
		if (remult.context.sqlToken) throw new Error('Tokens cannot mint tokens')
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

	@BackendMethod({ allowed: admins, apiPrefix: 'ff/sqlToken' })
	static async revoke(id: string): Promise<void> {
		if (remult.context.sqlToken) throw new Error('Tokens cannot revoke tokens')
		const row = await repo(SqlToken).findFirst({ id })
		if (!row) throw new Error('Not found')
		if (!row.revokedAt) await repo(SqlToken).update(row, { revokedAt: new Date() })
	}

	/**
	 * The token decides the mode: `write` runs the statement as is; otherwise it
	 * goes through readOnlySql, where the database - not a regex - refuses writes.
	 * Non-transactional: the read path owns its own transaction.
	 */
	@BackendMethod({
		// With `userFromId` the minter's live roles must still allow it; otherwise the token is the authority.
		allowed: () =>
			!!remult.context.sqlToken &&
			(SqlTokenController.options?.userFromId ? remult.isAllowed(admins) : true),
		apiPrefix: 'ff/sqlToken',
		transactional: false,
	})
	static async sql(cmd: string): Promise<SqlResult> {
		const o = SqlTokenController.options
		const token = remult.context.sqlToken
		if (!o || !token) throw new Error('Token required')
		const cap: SqlTokenCap = token.caps.includes('write') ? 'write' : 'read'

		const run = async (): Promise<SqlResult> => {
			if (cap === 'write') {
				const { SqlAdminController } = await import('./SqlAdminController')
				return SqlAdminController.exec(cmd, true)
			}
			if (!o.pool) throw new Error('sqlAdmin({ tokens: { pool } }) is required for read tokens')
			const { readOnlySql } = await import('./server/readOnlySql')
			return readOnlySql(o.pool, cmd)
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
}
