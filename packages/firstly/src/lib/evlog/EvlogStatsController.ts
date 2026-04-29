import { BackendMethod, remult } from 'remult'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery, Roles_Evlog } from './evlogEntities.js'

export type MonthlyTraceStat = {
	month: string
	source: 'server' | 'client'
	count: number
	uniqueUsers: number
}

export type MonthlyAuditStat = {
	month: string
	total: number
	creates: number
	updates: number
	deletes: number
	other: number
}

export type MonthlyModuleStat = {
	month: string
	module: string
	count: number
}

export type TopPage = {
	pathname: string
	count: number
	users: number
}

export type PageFlow = {
	fromPage: string
	toPage: string
	count: number
}

export type UserAgentStat = {
	name: string
	count: number
	percent: number
}

export type QueryStat = {
	/** Truncated SQL for display (full text in `fullSql`). */
	sql: string
	fullSql: string
	count: number
	totalMs: number
	maxMs: number
	avgMs: number
	/** Top 3 trace paths that triggered this query. */
	topPaths: { path: string; count: number }[]
}

export type QueryStats = {
	slowest: QueryStat[]
	mostTime: QueryStat[]
	hottest: QueryStat[]
}

export type EvlogStatsData = {
	year: number
	/** True when any of the underlying `find()` calls hit `rowLimit` - stats are partial. */
	truncated: boolean
	totals: {
		traces: number
		audits: number
		uniqueActors: number
	}
	monthlyTraces: MonthlyTraceStat[]
	monthlyAudits: MonthlyAuditStat[]
	monthlyByModule: MonthlyModuleStat[]
	topPages: TopPage[]
	pageFlows: PageFlow[]
	browsers: UserAgentStat[]
	os: UserAgentStat[]
	devices: UserAgentStat[]
	queries: QueryStats
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const verbOf = (action: string): 'create' | 'update' | 'delete' | 'other' => {
	const dot = action.lastIndexOf('.')
	if (dot < 0) return 'other'
	const v = action.slice(dot + 1)
	if (v === 'create' || v === 'update' || v === 'delete') return v
	return 'other'
}

const percent = (n: number, total: number) =>
	total === 0 ? 0 : Math.round((n / total) * 1000) / 10

const topN = <T>(
	map: Map<string, T>,
	score: (v: T) => number,
	n: number,
): Array<{ key: string; value: T }> =>
	Array.from(map.entries(), ([key, value]) => ({ key, value }))
		.sort((a, b) => score(b.value) - score(a.value))
		.slice(0, n)

/**
 * Aggregated read-only stats over `_ff_evlog_trace` + `_ff_evlog_audit`.
 *
 * Aggregation runs in JS after a single `repo.find()` per table (capped at
 * `rowLimit`, default 100k) so it stays dialect-agnostic - works on Postgres,
 * SQLite, and anything else Remult drives. For high-volume systems, subclass
 * and replace with a dialect-specific SQL view.
 *
 * Browser / OS / device stats read from `event.userAgent`, which is populated
 * by `evlog/enrichers`'s `createUserAgentEnricher()` - see README.
 */
export class EvlogStatsController {
	@BackendMethod({ allowed: Roles_Evlog.Evlog_Admin })
	static async getStats(year: number, rowLimit = 100_000): Promise<EvlogStatsData> {
		const yearStart = new Date(Date.UTC(year, 0, 1))
		const yearEnd = new Date(Date.UTC(year + 1, 0, 1))

		const [traces, audits, queries] = await Promise.all([
			remult.repo(EvlogTrace).find({
				where: { timestamp: { $gte: yearStart, $lt: yearEnd } },
				limit: rowLimit,
			}),
			remult.repo(EvlogAudit).find({
				where: { timestamp: { $gte: yearStart, $lt: yearEnd } },
				limit: rowLimit,
			}),
			remult.repo(EvlogTraceQuery).find({
				where: { timestamp: { $gte: yearStart, $lt: yearEnd } },
				limit: rowLimit,
			}),
		])
		const truncated =
			traces.length === rowLimit || audits.length === rowLimit || queries.length === rowLimit

		// ── monthly traces (by source) ────────────────────────────────────────
		const monthlyTracesMap = new Map<string, MonthlyTraceStat>()
		for (const t of traces) {
			const m = monthKey(t.timestamp)
			const src: 'server' | 'client' = t.source === 'client' ? 'client' : 'server'
			const k = `${m}|${src}`
			let row = monthlyTracesMap.get(k)
			if (!row) {
				row = { month: m, source: src, count: 0, uniqueUsers: 0 }
				monthlyTracesMap.set(k, row)
			}
			row.count++
		}
		// uniqueUsers per (month, source)
		const userBuckets = new Map<string, Set<string>>()
		for (const t of traces) {
			if (!t.actorId) continue
			const k = `${monthKey(t.timestamp)}|${t.source === 'client' ? 'client' : 'server'}`
			let s = userBuckets.get(k)
			if (!s) {
				s = new Set()
				userBuckets.set(k, s)
			}
			s.add(t.actorId)
		}
		for (const [k, s] of userBuckets) {
			const row = monthlyTracesMap.get(k)
			if (row) row.uniqueUsers = s.size
		}
		const monthlyTraces = [...monthlyTracesMap.values()].toSorted((a, b) =>
			a.month === b.month ? a.source.localeCompare(b.source) : a.month.localeCompare(b.month),
		)

		// ── monthly audits (verb split) ───────────────────────────────────────
		const monthlyAuditsMap = new Map<string, MonthlyAuditStat>()
		for (const a of audits) {
			const m = monthKey(a.timestamp)
			let row = monthlyAuditsMap.get(m)
			if (!row) {
				row = { month: m, total: 0, creates: 0, updates: 0, deletes: 0, other: 0 }
				monthlyAuditsMap.set(m, row)
			}
			row.total++
			const verb = verbOf(a.action)
			if (verb === 'create') row.creates++
			else if (verb === 'update') row.updates++
			else if (verb === 'delete') row.deletes++
			else row.other++
		}
		const monthlyAudits = [...monthlyAuditsMap.values()].toSorted((a, b) =>
			a.month.localeCompare(b.month),
		)

		// ── monthly by module (cross-table: reports, mail, ...) ──────────────
		const monthlyByModuleMap = new Map<string, MonthlyModuleStat>()
		const bumpModule = (mod: string | null | undefined, ts: Date) => {
			const key = `${monthKey(ts)}|${mod ?? '(none)'}`
			let row = monthlyByModuleMap.get(key)
			if (!row) {
				row = { month: monthKey(ts), module: mod ?? '(none)', count: 0 }
				monthlyByModuleMap.set(key, row)
			}
			row.count++
		}
		for (const a of audits) bumpModule(a.module, a.timestamp)
		for (const t of traces) if (t.module) bumpModule(t.module, t.timestamp)
		const monthlyByModule = [...monthlyByModuleMap.values()].toSorted((a, b) =>
			a.month === b.month ? b.count - a.count : a.month.localeCompare(b.month),
		)

		// ── top pages (client navs) ───────────────────────────────────────────
		const pageMap = new Map<string, { count: number; users: Set<string> }>()
		for (const t of traces) {
			if (t.source !== 'client' || !t.path) continue
			let row = pageMap.get(t.path)
			if (!row) {
				row = { count: 0, users: new Set() }
				pageMap.set(t.path, row)
			}
			row.count++
			if (t.actorId) row.users.add(t.actorId)
		}
		const topPages: TopPage[] = topN(pageMap, (v) => v.count, 10).map(({ key, value }) => ({
			pathname: key,
			count: value.count,
			users: value.users.size,
		}))

		// ── page flows (LAG by actor over time) ───────────────────────────────
		const navByActor = new Map<string, EvlogTrace[]>()
		for (const t of traces) {
			if (t.source !== 'client' || !t.path || !t.actorId) continue
			let arr = navByActor.get(t.actorId)
			if (!arr) {
				arr = []
				navByActor.set(t.actorId, arr)
			}
			arr.push(t)
		}
		const flowMap = new Map<string, number>()
		for (const arr of navByActor.values()) {
			arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
			for (let i = 1; i < arr.length; i++) {
				const from = arr[i - 1].path!
				const to = arr[i].path!
				if (from === to) continue
				const k = `${from} -> ${to}`
				flowMap.set(k, (flowMap.get(k) ?? 0) + 1)
			}
		}
		const pageFlows: PageFlow[] = [...flowMap.entries()]
			.toSorted((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([k, count]) => {
				const [fromPage, toPage] = k.split(' -> ')
				return { fromPage, toPage, count }
			})

		// ── user agent stats (browsers / os / devices) ────────────────────────
		const browserMap = new Map<string, number>()
		const osMap = new Map<string, number>()
		const deviceMap = new Map<string, number>()
		let uaTotal = 0
		for (const t of traces) {
			const ua = (
				t.event as {
					userAgent?: { browser?: { name?: string }; os?: { name?: string }; device?: { type?: string } }
				} | null
			)?.userAgent
			if (!ua) continue
			uaTotal++
			const b = ua.browser?.name ?? '(unknown)'
			const o = ua.os?.name ?? '(unknown)'
			const d = ua.device?.type ?? 'unknown'
			browserMap.set(b, (browserMap.get(b) ?? 0) + 1)
			osMap.set(o, (osMap.get(o) ?? 0) + 1)
			deviceMap.set(d, (deviceMap.get(d) ?? 0) + 1)
		}
		const toUaStats = (m: Map<string, number>): UserAgentStat[] =>
			[...m.entries()]
				.toSorted((a, b) => b[1] - a[1])
				.map(([name, count]) => ({ name, count, percent: percent(count, uaTotal) }))

		// ── SQL queries (slowest / most time / hottest) ──────────────────────
		// Pulled straight from `_ff_evlog_trace_query` rows. Remult emits
		// parameterized SQL (`select ... where id = $1`) so a plain string-keyed
		// Map dedupes correctly without normalization. Note: raw template-string
		// interpolation (`SqlDatabase.execute(\`...where id = ${userId}\`)`) will
		// look unique per call and won't aggregate.
		type QueryAgg = {
			sql: string
			count: number
			totalMs: number
			maxMs: number
			paths: Map<string, number>
		}
		const queryMap = new Map<string, QueryAgg>()
		for (const q of queries) {
			if (!q.sql) continue
			let row = queryMap.get(q.sql)
			if (!row) {
				row = { sql: q.sql, count: 0, totalMs: 0, maxMs: 0, paths: new Map() }
				queryMap.set(q.sql, row)
			}
			const dur = typeof q.duration === 'number' ? q.duration : 0
			row.count++
			row.totalMs += dur
			if (dur > row.maxMs) row.maxMs = dur
			const triggerPath = q.path ?? '(none)'
			row.paths.set(triggerPath, (row.paths.get(triggerPath) ?? 0) + 1)
		}
		const round2 = (n: number) => Math.round(n * 100) / 100
		const finalize = (r: QueryAgg): QueryStat => ({
			sql: r.sql.length > 100 ? r.sql.slice(0, 97) + '…' : r.sql,
			fullSql: r.sql,
			count: r.count,
			totalMs: round2(r.totalMs),
			maxMs: round2(r.maxMs),
			avgMs: round2(r.totalMs / r.count),
			topPaths: [...r.paths.entries()]
				.toSorted((a, b) => b[1] - a[1])
				.slice(0, 3)
				.map(([path, count]) => ({ path, count })),
		})
		const allQueries = Array.from(queryMap.values(), finalize)
		const slowestQueries = allQueries.toSorted((a, b) => b.maxMs - a.maxMs).slice(0, 10)
		const mostTimeQueries = allQueries.toSorted((a, b) => b.totalMs - a.totalMs).slice(0, 10)
		const hottestQueries = allQueries.toSorted((a, b) => b.count - a.count).slice(0, 10)

		// ── totals ────────────────────────────────────────────────────────────
		const allActors = new Set<string>()
		for (const t of traces) if (t.actorId) allActors.add(t.actorId)
		for (const a of audits) if (a.actorId) allActors.add(a.actorId)

		return {
			year,
			truncated,
			totals: {
				traces: traces.length,
				audits: audits.length,
				uniqueActors: allActors.size,
			},
			monthlyTraces,
			monthlyAudits,
			monthlyByModule,
			topPages,
			pageFlows,
			browsers: toUaStats(browserMap),
			os: toUaStats(osMap),
			devices: toUaStats(deviceMap),
			queries: {
				slowest: slowestQueries,
				mostTime: mostTimeQueries,
				hottest: hottestQueries,
			},
		}
	}
}
