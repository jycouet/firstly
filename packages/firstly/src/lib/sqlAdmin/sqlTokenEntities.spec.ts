import { describe, expect, it } from 'vitest'

import { isSqlTokenLive } from './sqlTokenEntities'

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
