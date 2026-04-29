import { SqlDatabase } from 'remult'

import { isLoggingSuppressed } from './suppress.js'

/**
 * Mount evlog's SQL span emitter on `SqlDatabase.LogToConsole`. Each query
 * becomes a `log.info('db.query', { sql, duration, args })` entry on the
 * current request's wide event - no separate fork per query (cheaper).
 *
 * Self-loop guard: when a drain is currently writing audit / trace rows,
 * `isLoggingSuppressed()` returns true and the hook is a no-op.
 *
 * `tablesToHide` lets you skip noisy tables (the audit / trace tables are
 * skipped by default since the suppress flag already covers them - this is
 * belt-and-suspenders for unusual code paths).
 */
export function mountSqlSpans(options?: { tablesToHide?: string[]; minDurationMs?: number }) {
	const minDuration = options?.minDurationMs ?? SqlDatabase.durationThreshold ?? 0
	const hidden = new Set(
		(options?.tablesToHide ?? ['_ff_evlog_audit', '_ff_evlog_trace']).map((t) => t.toLowerCase()),
	)

	SqlDatabase.LogToConsole = async (duration: number, query: string, args: Record<string, any>) => {
		if (isLoggingSuppressed()) return
		if (duration < minDuration) return

		const sql = query.replace(/\s+/gm, ' ').trim()
		const lower = sql.toLowerCase()
		for (const t of hidden) {
			if (lower.includes(t)) return
		}

		try {
			const { useLogger } = await import('evlog/sveltekit')
			// Nest under `db_queries[]` so multiple queries accumulate (evlog merges
			// arrays via concat) instead of clobbering top-level fields like
			// `duration`/`sql`/`args` that the request wide event already owns.
			useLogger().set({
				db_queries: [
					{
						sql: sql.length > 500 ? sql.slice(0, 500) + '...' : sql,
						duration,
						args,
					},
				],
			})
		} catch {
			// outside of any request context (cron, scripts) - silently drop
		}
	}
}
