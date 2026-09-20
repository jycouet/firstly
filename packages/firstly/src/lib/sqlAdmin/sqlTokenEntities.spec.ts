import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryDataProvider, remult, repo } from 'remult'

import { isSqlTokenLive, SQL_TOKEN_DELETE_LIVE, SqlToken, SqlTokenCall } from './sqlTokenEntities'

describe('isSqlTokenLive', () => {
	const now = Date.now()
	it('needs a future expiry and no revocation', () => {
		expect(isSqlTokenLive({ expiresAt: new Date(now + 1000), revokedAt: null }, now)).toBe(true)
		expect(isSqlTokenLive({ expiresAt: new Date(now - 1), revokedAt: null }, now)).toBe(false)
		expect(isSqlTokenLive({ expiresAt: new Date(now + 1000), revokedAt: new Date() }, now)).toBe(
			false,
		)
	})
})

describe('deleting a token', () => {
	beforeEach(() => {
		remult.dataProvider = new InMemoryDataProvider()
	})

	const insert = (expiresAt: Date, revokedAt: Date | null = null) =>
		repo(SqlToken).insert({ name: 'n', expiresAt, revokedAt })

	it('takes its calls with it', async () => {
		const dead = await insert(new Date(Date.now() - 1))
		const other = await insert(new Date(Date.now() - 1))
		await repo(SqlTokenCall).insert([{ tokenId: dead.id }, { tokenId: other.id }])

		await repo(SqlToken).delete(dead)

		expect(await repo(SqlTokenCall).find()).toMatchObject([{ tokenId: other.id }])
	})

	it('is refused while the token is live - revoke first', async () => {
		const live = await insert(new Date(Date.now() + 60_000))
		await expect(repo(SqlToken).delete(live)).rejects.toThrow(SQL_TOKEN_DELETE_LIVE)

		await repo(SqlToken).update(live.id, { revokedAt: new Date() })
		await expect(repo(SqlToken).delete(live.id)).resolves.not.toThrow()
	})
})
