import { buildAuditFields, createLogger, type DrainContext, type DrainFn } from 'evlog'
import { remult, SqlDatabase, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery } from '../evlogEntities.js'

import { withSuppressedLogging } from './suppress.js'

/**
 * Captured at `evlog()` `initApi` so drains can run AFTER the request's
 * Remult async context has been torn down (the SvelteKit handle calls drains
 * post-`resolve()`, by which point `remult.dataProvider` is no longer
 * accessible from the current async scope).
 */
let capturedDataProvider: DataProvider | undefined

export function captureDataProvider(dp: DataProvider) {
	capturedDataProvider = dp
}

async function inDetachedContext<T>(fn: () => Promise<T>): Promise<T> {
	// Lazy capture: in dev, vite HMR can wipe `capturedDataProvider`. If we're
	// still inside a Remult request scope (audit drains often are), grab the
	// provider opportunistically before falling back.
	if (!capturedDataProvider) {
		try {
			if (remult.dataProvider) capturedDataProvider = remult.dataProvider
		} catch {
			// `remult.dataProvider` access throws when no async context exists
		}
	}
	if (!capturedDataProvider) {
		return fn()
	}
	return withRemult(fn, { dataProvider: capturedDataProvider }) as Promise<T>
}

/**
 * Drain that persists `audit`-bearing wide events into a Remult-backed entity
 * (default: `EvlogAudit` → `_ff_evlog_audit`). Pass a custom entity to use a
 * different table (e.g. for side-by-side migration in My Minion).
 *
 * Skips events without an `audit` field (those go to the trace drain).
 * All writes happen inside `withSuppressedLogging` so the SQL span hook
 * does not re-emit them in a loop.
 */
export function remultAuditDrain(entity: typeof EvlogAudit = EvlogAudit): DrainFn {
	return async (ctx: DrainContext) => {
		const a = ctx.event.audit
		if (!a) return
		const evt = ctx.event as Record<string, unknown>
		try {
			await inDetachedContext(() =>
				withSuppressedLogging(() =>
					remult.repo(entity).insert({
						timestamp: new Date(ctx.event.timestamp),
						traceId: a.context?.traceId ?? null,
						correlationId: a.correlationId ?? null,
						module: (evt.module as string) ?? null,
						action: a.action,
						outcome: a.outcome,
						reason: a.reason ?? null,
						actorType: a.actor.type,
						actorId: a.actor.id,
						targetType: a.target?.type ?? null,
						targetId: a.target?.id ? String(a.target.id) : null,
						changes: a.changes ?? null,
						context: a.context ?? null,
						raw: ctx.event,
					}),
				),
			)
		} catch (err) {
			console.error('[firstly/evlog] auditDrain insert failed:', err)
		}
	}
}

export interface RemultTraceDrainOptions {
	/** Drop rows older than this. Not yet implemented (TODO). */
	retentionDays?: number
	/**
	 * Skip persisting traces whose `path` matches one of these patterns. Useful
	 * for high-volume noise like `/api/_liveQueryKeepAlive` or health-checks.
	 * Patterns are exact-match by default; suffix `*` for prefix match.
	 *
	 * @default ['/api/_liveQueryKeepAlive', '/api/_ff_evlog_audit*', '/api/_ff_evlog_trace*']
	 */
	skipPaths?: string[]
}

const DEFAULT_SKIP_PATHS = [
	'/api/_liveQueryKeepAlive',
	'/api/_ff_evlog_audit*',
	'/api/_ff_evlog_trace*',
	// `_ff_evlog_trace_query` is matched by the `_ff_evlog_trace*` prefix above.
	'/api/recordNavigation', // self-call from EvlogClientController (deprecated path)
	'/api/recordNavigations',
	'/api/purgeOlderThan',
]

function compilePathSkip(patterns: string[]): (path: string | null | undefined) => boolean {
	const exact = new Set<string>()
	const prefixes: string[] = []
	for (const p of patterns) {
		if (p.endsWith('*')) prefixes.push(p.slice(0, -1))
		else exact.add(p)
	}
	return (path) => {
		if (!path) return false
		if (exact.has(path)) return true
		for (const p of prefixes) if (path.startsWith(p)) return true
		return false
	}
}

/**
 * Drain that persists non-audit wide events (request stats, forks, ad-hoc
 * `log.info`) into a Remult-backed entity (default: `EvlogTrace` →
 * `_ff_evlog_trace`).
 *
 * SQL spans are split out into `EvlogTraceQuery` (default
 * `_ff_evlog_trace_query`) so the trace's `event` JSON stays small and
 * dashboards can group queries without JSON path ops. The `db_queries`
 * field is stripped from the persisted `event`.
 */
export function remultTraceDrain(
	entity: typeof EvlogTrace = EvlogTrace,
	options?: RemultTraceDrainOptions & { queryEntity?: typeof EvlogTraceQuery },
): DrainFn {
	const shouldSkip = compilePathSkip(options?.skipPaths ?? DEFAULT_SKIP_PATHS)
	const queryEntity = options?.queryEntity ?? EvlogTraceQuery
	return async (ctx: DrainContext) => {
		if (ctx.event.audit) return
		const evt = ctx.event as Record<string, unknown>
		const path = (evt.path as string) ?? ctx.request?.path
		if (shouldSkip(path)) return
		const dbQueries = evt.db_queries as
			| Array<{ sql?: string; duration?: number; args?: unknown }>
			| undefined
		// Persist trace without the (potentially large) db_queries[] payload.
		const eventForStorage: Record<string, unknown> = { ...evt }
		delete eventForStorage.db_queries
		const timestamp = new Date(ctx.event.timestamp)
		try {
			await inDetachedContext(() =>
				withSuppressedLogging(async () => {
					const trace = await remult.repo(entity).insert({
						timestamp,
						level: ctx.event.level,
						source: ((evt.source as string) ?? 'server') as 'server' | 'client',
						service: ctx.event.service ?? null,
						environment: ctx.event.environment ?? null,
						traceId: (evt.traceId as string) ?? null,
						requestId: (evt.requestId as string) ?? null,
						parentRequestId: (evt._parentRequestId as string) ?? null,
						method: (evt.method as string) ?? ctx.request?.method ?? null,
						path: path ?? null,
						status: (evt.status as number) ?? null,
						duration: parseDuration(evt.duration),
						operation: (evt.operation as string) ?? null,
						module: (evt.module as string) ?? null,
						actorId: (evt.actorId as string) ?? (evt.userId as string) ?? null,
						event: eventForStorage,
					})
					if (dbQueries?.length) {
						await remult.repo(queryEntity).insert(
							dbQueries
								.filter((q) => typeof q.sql === 'string' && q.sql.length > 0)
								.map((q) => ({
									timestamp,
									traceId: trace.id,
									path: path ?? null,
									sql: q.sql as string,
									duration: typeof q.duration === 'number' ? q.duration : 0,
									args: q.args ?? null,
								})),
						)
					}
				}),
			)
		} catch (err) {
			// Surface drain failures - the wrapping `runEnrichAndDrain` swallows
			// them at WARN level which is easy to miss in dev.
			console.error('[firstly/evlog] traceDrain insert failed:', err)
		}
	}
}

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

const DURATION_RE = /^([\d.]+)\s*(ms|s|m)$/
/** Convert evlog's `"3ms"` / `"1.2s"` duration formats into milliseconds. */
function parseDuration(raw: unknown): number | null {
	if (typeof raw === 'number') return raw
	if (typeof raw !== 'string') return null
	const m = DURATION_RE.exec(raw)
	if (!m) return Number(raw) || null
	const n = parseFloat(m[1])
	if (m[2] === 's') return n * 1000
	if (m[2] === 'm') return n * 60_000
	return n
}

/** Compose multiple drains into one fan-out (Promise.allSettled). */
export function fanout(...drains: DrainFn[]): DrainFn {
	return async (ctx) => {
		await Promise.allSettled(drains.map((d) => d(ctx)))
	}
}

