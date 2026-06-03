import { SqlDatabase } from 'remult'

import { isLoggingSuppressed } from './suppress.js'

let mounted = false

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
	if (mounted) {
		// Returning early (rather than re-wrapping) is critical: re-wrapping would
		// capture our own first wrapper as `previous` and chain to it, so every
		// query would be recorded twice. The first mount stays active.
		console.warn(
			'[firstly/evlog] mountSqlSpans called twice - ignoring the second call (the first ' +
				'mount stays active). This usually means evlog() was registered more than once.',
		)
		return
	}
	mounted = true
	const minDuration = options?.minDurationMs ?? SqlDatabase.durationThreshold ?? 0
	const hidden = new Set(
		(options?.tablesToHide ?? ['_ff_evlog_audit', '_ff_evlog_trace', '_ff_evlog_trace_query']).map(
			(t) => t.toLowerCase(),
		),
	)

	// Chain: preserve any user-set `LogToConsole` (custom slow-query logger,
	// boolean flags, the built-in `'oneLiner'` mode) and call it after our
	// own emit. We replace the global so we have to.
	const previous = SqlDatabase.LogToConsole

	SqlDatabase.LogToConsole = async (duration: number, query: string, args: Record<string, any>) => {
		if (isLoggingSuppressed()) {
			await callPrevious(previous, duration, query, args)
			return
		}
		if (duration < minDuration) {
			await callPrevious(previous, duration, query, args)
			return
		}

		const sql = query.replace(/\s+/gm, ' ').trim()
		const lower = sql.toLowerCase()
		for (const t of hidden) {
			if (lower.includes(t)) {
				await callPrevious(previous, duration, query, args)
				return
			}
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

		await callPrevious(previous, duration, query, args)
	}
}

async function callPrevious(
	previous: typeof SqlDatabase.LogToConsole,
	duration: number,
	query: string,
	args: Record<string, any>,
) {
	if (typeof previous === 'function') {
		try {
			await previous(duration, query, args)
		} catch (err) {
			console.error('[firstly/evlog] chained LogToConsole handler failed:', err)
		}
	}
	// Boolean / 'oneLiner' modes are handled by remult internally only when
	// `LogToConsole` is set to those literal values - replacing with a
	// function disables them by design. Document via README if needed.
}
