import Database from 'better-sqlite3'
import { describe, expect, it, vi } from 'vitest'

import { remult, SqlDatabase, withRemult } from 'remult'
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery } from '../evlogEntities.js'
import { captureDataProvider, resetCapturedDataProvider } from './dataProviderCapture.js'
import { purgeEvlog } from './remultDrains.js'

// Keep the self-audit emit a no-op so the test isolates DB delete behavior.
vi.mock('evlog', async (orig) => {
	const mod = await orig<typeof import('evlog')>()
	return { ...mod, createLogger: () => ({ emit: () => {} }) }
})

const DAY = 24 * 60 * 60 * 1000

async function withDb<T>(fn: (db: Database.Database, dp: SqlDatabase) => Promise<T>): Promise<T> {
	const db = new Database(':memory:')
	const dp = new SqlDatabase(new BetterSqlite3DataProvider(db))
	resetCapturedDataProvider()
	captureDataProvider(dp)
	try {
		return await withRemult(
			async () => {
				const metas = [EvlogAudit, EvlogTrace, EvlogTraceQuery].map(
					(e) => remult.repo(e as never).metadata,
				)
				await dp.ensureSchema(metas)
				return fn(db, dp)
			},
			{ dataProvider: dp },
		)
	} finally {
		resetCapturedDataProvider()
		db.close()
	}
}

describe('purgeEvlog', () => {
	it('deletes only trace + query rows older than the cutoff, leaving recent + audit rows', async () => {
		await withDb(async () => {
			const old = new Date(Date.now() - 100 * DAY)
			const recent = new Date(Date.now() - 1 * DAY)

			await remult.repo(EvlogTrace).insert([
				{ id: 't-old', timestamp: old },
				{ id: 't-new', timestamp: recent },
			])
			await remult.repo(EvlogTraceQuery).insert([
				{ id: 'q-old', timestamp: old },
				{ id: 'q-new', timestamp: recent },
			])
			await remult.repo(EvlogAudit).insert([{ id: 'a-old', timestamp: old }])

			const result = await purgeEvlog({ days: 90 })

			expect(result).toEqual({ traces: 1, queries: 1 })
			expect((await remult.repo(EvlogTrace).find()).map((r) => r.id)).toEqual(['t-new'])
			expect((await remult.repo(EvlogTraceQuery).find()).map((r) => r.id)).toEqual(['q-new'])
			// Audit rows are intentionally never purged.
			expect(await remult.repo(EvlogAudit).count()).toBe(1)
		})
	})

	it('refuses to purge with days <= 0 (would otherwise delete everything)', async () => {
		await withDb(async () => {
			await remult.repo(EvlogTrace).insert([{ id: 't1', timestamp: new Date() }])
			await expect(purgeEvlog({ days: 0 })).rejects.toThrow(/positive/i)
			await expect(purgeEvlog({ days: -5 })).rejects.toThrow(/positive/i)
			// Nothing was deleted.
			expect(await remult.repo(EvlogTrace).count()).toBe(1)
		})
	})
})
