import { buildAuditFields, createLogger } from 'evlog'

import { remult, SqlDatabase } from 'remult'

import { EvlogTrace, EvlogTraceQuery } from '../evlogEntities.js'
import { captureDataProvider, inDetachedContext } from './dataProviderCapture.js'
import { withSuppressedLogging } from './suppress.js'

export { captureDataProvider }

/**
 * Delete trace + trace-query rows older than `days` days (default 90).
 * Audit rows are intentionally untouched - audit retention is a compliance
 * decision, not an operational one.
 *
 * Returns the row counts deleted so callers can log / surface them.
 */
export async function purgeEvlog(options?: {
	days?: number
	traceEntity?: typeof EvlogTrace
	queryEntity?: typeof EvlogTraceQuery
}): Promise<{ traces: number; queries: number }> {
	const days = options?.days ?? 90
	const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
	const traceEntity = options?.traceEntity ?? EvlogTrace
	const queryEntity = options?.queryEntity ?? EvlogTraceQuery

	const result = await inDetachedContext(() =>
		withSuppressedLogging(async () => {
			// Raw SQL beats `repo.deleteMany` here: bulk truncation of operational
			// tables doesn't need lifecycle hooks (these entities have none) and
			// avoids row-by-row delete plans on dialects that fall back to it.
			// Falls back to `deleteMany` for non-SQL data providers (json/file).
			const traces = await rawDeleteOlderThan(traceEntity, cutoff)
			const queries = await rawDeleteOlderThan(queryEntity, cutoff)
			return { traces, queries }
		}),
	)

	// Audit the purge itself - "system performed a bulk delete" is a thing
	// auditors care about. Emitted outside the suppression scope so the audit
	// drain actually persists it, but inside `inDetachedContext` so the drain
	// can find a Remult context.
	if (result.traces > 0 || result.queries > 0) {
		await inDetachedContext(async () => {
			const fields = buildAuditFields({
				action: 'evlog.purge',
				actor: { type: 'system', id: 'system' },
				target: { type: 'evlog', id: `${days}d` },
				outcome: 'success',
				reason: `Purged trace + trace-query rows older than ${days} days`,
				changes: { deleted: { traces: result.traces, queries: result.queries } } as never,
			})
			createLogger({ audit: fields, module: 'evlog' }).emit({ _forceKeep: true })
		})
	}

	return result
}

type TimestampedEntity = { timestamp: Date }
async function rawDeleteOlderThan(
	entity: { new (): TimestampedEntity },
	cutoff: Date,
): Promise<number> {
	const dp = remult.dataProvider
	const repo = remult.repo<TimestampedEntity>(entity)
	const isSql = dp && typeof (dp as { createCommand?: unknown }).createCommand === 'function'
	if (!isSql) {
		return repo.deleteMany({ where: { timestamp: { $lt: cutoff } } })
	}
	const sqlDb = SqlDatabase.getDb(dp)
	const meta = repo.metadata
	const tableName = meta.options.dbName ?? meta.key
	const tsColumn = meta.fields.timestamp.options.dbName ?? 'timestamp'
	// Count first - portable across dialects (RETURNING is Postgres-only and
	// SQLite-3.35+, not guaranteed). Two queries; the alternative is dialect
	// branching, which is worse.
	const countCmd = sqlDb.createCommand()
	const countParam = countCmd.param(cutoff)
	const countResult = await countCmd.execute(
		`select count(*) as c from ${sqlDb.wrapIdentifier(tableName)} where ${sqlDb.wrapIdentifier(tsColumn)} < ${countParam}`,
	)
	const count = Number(countResult.rows[0]?.c ?? countResult.rows[0]?.count ?? 0)
	if (count === 0) return 0
	const delCmd = sqlDb.createCommand()
	const delParam = delCmd.param(cutoff)
	await delCmd.execute(
		`delete from ${sqlDb.wrapIdentifier(tableName)} where ${sqlDb.wrapIdentifier(tsColumn)} < ${delParam}`,
	)
	return count
}

type EvlogIndexedEntity = { new (): { timestamp: Date; traceId?: string | null } }

/**
 * Create the indexes remult does not. remult only indexes the primary key, but
 * evlog filters every table by `timestamp` (getStats year-range + boot purge)
 * and links queries to traces by `traceId` - without indexes both are full
 * table scans that get slower as the tables grow.
 *
 * Uses `create index if not exists` (portable across SQLite + Postgres), so it
 * is idempotent and safe to run on every boot. No-op for non-SQL providers
 * (json / file), and each statement is isolated so one failure can't break boot.
 */
export async function ensureEvlogIndexes(
	entities: Array<EvlogIndexedEntity | undefined>,
): Promise<void> {
	await inDetachedContext(async () => {
		const dp = remult.dataProvider
		if (!dp || typeof (dp as { createCommand?: unknown }).createCommand !== 'function') return
		const sqlDb = SqlDatabase.getDb(dp)
		for (const entity of entities) {
			if (!entity) continue
			const meta = remult.repo(entity).metadata
			const table = meta.options.dbName ?? meta.key
			for (const fieldKey of ['timestamp', 'traceId'] as const) {
				const field = (meta.fields as unknown as Record<string, { options?: { dbName?: string } }>)[
					fieldKey
				]
				if (!field) continue
				const column = field.options?.dbName ?? fieldKey
				const indexName = `${table}_${column}_idx`
				try {
					await sqlDb
						.createCommand()
						.execute(
							`create index if not exists ${sqlDb.wrapIdentifier(indexName)} on ${sqlDb.wrapIdentifier(table)} (${sqlDb.wrapIdentifier(column)})`,
						)
				} catch (err) {
					console.warn(`[firstly/evlog] could not ensure index ${indexName}:`, err)
				}
			}
		}
	})
}
