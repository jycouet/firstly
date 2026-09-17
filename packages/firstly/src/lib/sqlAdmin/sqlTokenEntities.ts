import { Entity, Fields } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'

/** One capability = one thing a token may do. `write` runs SQL as is, `read` inside a READ ONLY transaction. */
export const SQL_TOKEN_CAPS = ['read', 'write'] as const
export type SqlTokenCap = (typeof SQL_TOKEN_CAPS)[number]

export const SQL_TOKEN_TTLS = { '1h': 3_600_000, '24h': 86_400_000, '7d': 604_800_000 } as const
export type SqlTokenTtl = keyof typeof SQL_TOKEN_TTLS

const admins = [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin]

// Read-only API for the admin list; minting/revoking go through
// SqlTokenController so the raw token is generated server-side and never stored.
@Entity<SqlToken>('_ff_sql_tokens', {
	caption: 'FF Sql Tokens',
	allowApiRead: admins,
	defaultOrderBy: { createdAt: 'desc' },
})
export class SqlToken {
	@Fields.id() id = ''
	@Fields.string() name = ''
	/** First chars of the raw token, so a leaked value can be matched to its row. */
	@Fields.string() hint = ''
	@Fields.string({ includeInApi: false }) tokenHash = ''
	/** Minter (`remult.user.id`). The token acts as this user when `userFromId` is configured. */
	@Fields.string() userId = ''
	@Fields.json<SqlToken, SqlTokenCap[]>() caps: SqlTokenCap[] = []
	@Fields.createdAt() createdAt = new Date()
	@Fields.date() expiresAt = new Date()
	@Fields.date({ allowNull: true }) lastUsedAt: Date | null = null
	@Fields.date({ allowNull: true }) revokedAt: Date | null = null
}

@Entity<SqlTokenCall>('_ff_sql_token_calls', {
	caption: 'FF Sql Token Calls',
	allowApiRead: admins,
	defaultOrderBy: { ts: 'desc' },
})
export class SqlTokenCall {
	@Fields.id() id = ''
	@Fields.string() tokenId = ''
	@Fields.string() cap = ''
	@Fields.string() cmd = ''
	@Fields.integer() rowCount = 0
	@Fields.integer() tookMs = 0
	@Fields.string({ allowNull: true }) error: string | null = null
	@Fields.createdAt() ts = new Date()
}

export const sqlTokenEntities = { SqlToken, SqlTokenCall }

export function isSqlTokenLive(t: { expiresAt: Date; revokedAt: Date | null }, now = Date.now()) {
	return !t.revokedAt && t.expiresAt.getTime() > now
}
