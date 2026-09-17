import { Entity, Fields } from 'remult'

import { FF_Role } from '../core/common'
import { Roles_SqlAdmin } from './Roles_SqlAdmin'

/** What a call may do: `read` runs inside a READ ONLY transaction (one statement), `write` runs SQL as is. */
export const SQL_CAPABILITIES = ['read', 'write'] as const
export type SqlCapability = (typeof SQL_CAPABILITIES)[number]

export const SQL_TOKEN_TTLS = { '1h': 3_600_000, '24h': 86_400_000, '7d': 604_800_000 } as const
export type SqlTokenTtl = keyof typeof SQL_TOKEN_TTLS

const admins = [Roles_SqlAdmin.SqlAdmin_Admin, FF_Role.FF_Role_Admin]

// Minting is `SqlAdminController.mintToken` (the raw value is generated
// server-side, shown once, never stored). Revoking is the one update the API
// allows: set `revokedAt`; nothing else is writable and a revoke is final.
@Entity<SqlToken>('_ff_sql_tokens', {
	caption: 'FF Sql Tokens',
	allowApiRead: admins,
	allowApiUpdate: admins,
	defaultOrderBy: { createdAt: 'desc' },
	saving: (t, e) => {
		if (!e.isNew && e.fields.revokedAt.valueChanged() && !t.revokedAt) {
			throw new Error('A revoked token stays revoked')
		}
	},
})
export class SqlToken {
	@Fields.id() id = ''
	@Fields.string({ allowApiUpdate: false }) name = ''
	/** First chars of the raw token, so a leaked value can be matched to its row. */
	@Fields.string({ allowApiUpdate: false }) hint = ''
	@Fields.string({ includeInApi: false }) tokenHash = ''
	/** Minter (`remult.user.id`). The token acts as this user when `userFromId` is configured. */
	@Fields.string({ allowApiUpdate: false }) userId = ''
	@Fields.json<SqlToken, SqlCapability[]>({ allowApiUpdate: false }) capabilities: SqlCapability[] =
		[]
	@Fields.createdAt() createdAt = new Date()
	@Fields.date({ allowApiUpdate: false }) expiresAt = new Date()
	@Fields.date({ allowNull: true, allowApiUpdate: false }) lastUsedAt: Date | null = null
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
	@Fields.string() capability = ''
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
