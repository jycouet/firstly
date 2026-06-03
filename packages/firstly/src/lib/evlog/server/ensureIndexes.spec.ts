import Database from 'better-sqlite3'
import { describe, expect, it } from 'vitest'

import { remult, SqlDatabase, withRemult } from 'remult'
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery } from '../evlogEntities.js'
import { captureDataProvider, resetCapturedDataProvider } from './dataProviderCapture.js'
import { ensureEvlogIndexes } from './remultDrains.js'

function indexNames(db: Database.Database, table: string): string[] {
	return (
		db
			.prepare("select name from sqlite_master where type = 'index' and tbl_name = ?")
			.all(table) as { name: string }[]
	).map((r) => r.name)
}

describe('ensureEvlogIndexes', () => {
	it('adds timestamp + traceId indexes that remult does not create on its own', async () => {
		const db = new Database(':memory:')
		const dp = new SqlDatabase(new BetterSqlite3DataProvider(db))
		resetCapturedDataProvider()
		captureDataProvider(dp)

		await withRemult(
			async () => {
				const metas = [EvlogAudit, EvlogTrace, EvlogTraceQuery].map(
					(e) => remult.repo(e as never).metadata,
				)
				await dp.ensureSchema(metas)

				// Baseline: remult only indexes the primary key (an `sqlite_autoindex_*`
				// from the inline PK) - nothing on `timestamp` or `traceId`.
				const before = indexNames(db, '_ff_evlog_trace')
				expect(before.some((n) => n.includes('timestamp'))).toBe(false)
				expect(before.some((n) => n.includes('traceId'))).toBe(false)

				await ensureEvlogIndexes([EvlogAudit, EvlogTrace, EvlogTraceQuery])

				expect(indexNames(db, '_ff_evlog_audit')).toContain('_ff_evlog_audit_timestamp_idx')
				expect(indexNames(db, '_ff_evlog_trace')).toContain('_ff_evlog_trace_timestamp_idx')
				const q = indexNames(db, '_ff_evlog_trace_query')
				expect(q).toContain('_ff_evlog_trace_query_timestamp_idx')
				expect(q).toContain('_ff_evlog_trace_query_traceId_idx')
			},
			{ dataProvider: dp },
		)
		resetCapturedDataProvider()
		db.close()
	})
})
