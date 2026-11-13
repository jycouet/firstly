import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { remult, SqlDatabase } from 'remult'

import { groupKeySql, normalizeSql, parseQuery } from './parseQuery.js'

type LogFn = (duration: number, query: string, args: Record<string, any>) => void

export type CapturedQuery = {
	sql: string
	args: Record<string, unknown>
	ms: number
	at: string
	/** `GET /athletes/[handle]`: the route (or api path) that ran it. */
	route?: string
	/** Same number = same request: N+1 shows as one query many times under one `req`. */
	req?: number
}

export type RequestContext = { route: string; key: object }

const REGEX_CATALOG = /\s(from|join)\s+"?(information_schema|pg_)/i
const REGEX_CATCH_ALL = /\[\.\.\./
// An id segment (number, uuid, cuid...): one route whatever the record.
const REGEX_ID_SEGMENT = /\/(?:\d+|(?=[\w-]*\d)[\w-]{16,})(?=\/|$)/g

const idless = (path: string) => path.replace(REGEX_ID_SEGMENT, '/[id]')

/**
 * Route of the current remult request: SvelteKit `RequestEvent` (route id, or path for a
 * catch-all like the remult api), else a node / express request.
 */
export function remultRequestContext(): RequestContext | undefined {
	let r: any
	try {
		r = (remult.context as { request?: unknown } | undefined)?.request
	} catch {
		return undefined
	}
	if (!r || typeof r !== 'object') return undefined
	if (r.url instanceof URL) {
		const id: string | null | undefined = r.route?.id
		const path = id && !REGEX_CATCH_ALL.test(id) ? id : idless(r.url.pathname)
		return { route: `${r.request?.method ?? 'GET'} ${path}`, key: r }
	}
	const url: string | undefined = r.originalUrl ?? r.url
	if (!url) return undefined
	return { route: `${r.method ?? 'GET'} ${idless(url.split('?')[0]!)}`, key: r }
}

/**
 * Wrap a `SqlDatabase.LogToConsole` fn to also append every SELECT to a JSONL file, with the
 * route that ran it. No file (env `FF_SQL_CAPTURE` unset) = `inner` untouched, so it can stay.
 *
 * @example
 * SqlDatabase.LogToConsole = withSqlCapture((...a) => FF_LogToConsole(...a))
 */
export function withSqlCapture(
	inner?: LogFn,
	o: { file?: string; context?: () => RequestContext | undefined } = {},
) {
	const file = o.file ?? process.env.FF_SQL_CAPTURE
	if (!file) return inner ?? false
	const context = o.context ?? remultRequestContext
	mkdirSync(dirname(file), { recursive: true })
	// Remult only calls LogToConsole above the threshold: capture needs every query.
	const thresholdMs = SqlDatabase.durationThreshold
	SqlDatabase.durationThreshold = 0
	const reqIds = new WeakMap<object, number>()
	// Per process: two captures appended to one file would reuse numbers, `at` tells them apart.
	let nextReq = 1
	const fn: LogFn = (duration, query, args) => {
		const kind = parseQuery(query).kind
		if ((kind === 'select' || kind === 'count') && !REGEX_CATALOG.test(query)) {
			const ctx = context()
			let req: number | undefined
			if (ctx) {
				req = reqIds.get(ctx.key)
				if (req === undefined) reqIds.set(ctx.key, (req = nextReq++))
			}
			const line: CapturedQuery = {
				sql: query,
				args,
				// Remult reports seconds.
				ms: duration * 1000,
				at: new Date().toISOString(),
				...(ctx ? { route: ctx.route, req } : {}),
			}
			// Sync: a test run may exit right after its last query.
			appendFileSync(file, JSON.stringify(line) + '\n')
		}
		if (inner && duration * 1000 >= thresholdMs) inner(duration, query, args)
	}
	return fn
}

export function readCapture(file: string): CapturedQuery[] {
	return readFileSync(file, 'utf8')
		.split('\n')
		.filter((l) => l.trim())
		.map((l) => JSON.parse(l) as CapturedQuery)
}

export type QueryGroup = {
	/** Stable across captures: hash of the normalized SQL, `$in` lists of any length alike. */
	id: string
	/** SQL of the slowest call, matching `args`. */
	sql: string
	table: string | null
	calls: number
	totalMs: number
	meanMs: number
	maxMs: number
	/** Args of the slowest call: the one worth replaying. */
	args: Record<string, unknown>
	/** Calls per route. Empty when the capture has no request context. */
	routes: Record<string, number>
	/** Most calls of this query within one request: > 1 on a list page smells N+1. */
	maxPerRequest: number
}

export const queryId = (sql: string) =>
	createHash('sha1').update(groupKeySql(sql)).digest('hex').slice(0, 8)

const reqKey = (e: CapturedQuery) => (e.req === undefined ? undefined : `${e.req}`)

export function groupQueries(entries: CapturedQuery[]): QueryGroup[] {
	const groups = new Map<string, QueryGroup>()
	const perReq = new Map<string, number>()
	for (const e of entries) {
		const sql = normalizeSql(e.sql)
		const id = queryId(sql)
		let g = groups.get(id)
		if (!g) {
			g = {
				id,
				sql,
				table: parseQuery(sql).table,
				calls: 0,
				totalMs: 0,
				meanMs: 0,
				maxMs: -1,
				args: e.args,
				routes: {},
				maxPerRequest: 1,
			}
			groups.set(id, g)
		}
		g.calls++
		g.totalMs += e.ms
		g.meanMs = g.totalMs / g.calls
		if (e.ms > g.maxMs) {
			g.maxMs = e.ms
			g.args = e.args
			g.sql = sql
		}
		if (e.route) g.routes[e.route] = (g.routes[e.route] ?? 0) + 1
		const rk = reqKey(e)
		if (rk) {
			const k = `${id}|${rk}`
			const n = (perReq.get(k) ?? 0) + 1
			perReq.set(k, n)
			if (n > g.maxPerRequest) g.maxPerRequest = n
		}
	}
	return [...groups.values()]
}

export type RouteStat = {
	route: string
	requests: number
	queries: number
	/** App ms of all captured queries, summed. */
	totalMs: number
	queriesPerRequest: number
	msPerRequest: number
	/** The query repeated most within one request of this route. */
	mostRepeated: { id: string; perRequest: number } | null
}

/** Per route: how many requests, how many queries each, and the worst repeat (N+1). */
export function groupRoutes(entries: CapturedQuery[]): RouteStat[] {
	const routes = new Map<
		string,
		{ reqs: Set<number>; queries: number; totalMs: number; repeat: Map<string, number> }
	>()
	for (const e of entries) {
		if (!e.route || e.req === undefined) continue
		let r = routes.get(e.route)
		if (!r) routes.set(e.route, (r = { reqs: new Set(), queries: 0, totalMs: 0, repeat: new Map() }))
		r.reqs.add(e.req)
		r.queries++
		r.totalMs += e.ms
		const k = `${queryId(normalizeSql(e.sql))}|${e.req}`
		r.repeat.set(k, (r.repeat.get(k) ?? 0) + 1)
	}
	return Array.from(routes, ([route, r]) => {
		let worst: RouteStat['mostRepeated'] = null
		for (const [k, n] of r.repeat) {
			if (n > 1 && (!worst || n > worst.perRequest)) worst = { id: k.split('|')[0]!, perRequest: n }
		}
		return {
			route,
			requests: r.reqs.size,
			queries: r.queries,
			totalMs: r.totalMs,
			queriesPerRequest: r.queries / r.reqs.size,
			msPerRequest: r.totalMs / r.reqs.size,
			mostRepeated: worst,
		}
	})
}

/** Remult names params `$1..$n`: positional values for a pg driver. */
export const positionalArgs = (args: Record<string, unknown>) =>
	Object.entries(args)
		.sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
		.map(([, v]) => v)
