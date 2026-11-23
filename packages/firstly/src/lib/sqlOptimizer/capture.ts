import { createHash } from 'node:crypto'
import { mkdirSync, openSync, readFileSync, writeSync } from 'node:fs'
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
	/** The page the user was on: the route itself, or the referer of an api call. */
	page?: string
	/** Same number = same request: N+1 shows as one query many times under one `req`. */
	req?: number
}

export type RequestContext = { route: string; page?: string; key: object }

const REGEX_CATALOG = /\s(from|join)\s+"?(information_schema|pg_)/i
const REGEX_SELECT_START = /^\s*select\s/i
const REGEX_CATCH_ALL = /\[\.\.\./
// An id segment (number, uuid, atproto tid, cuid...): one route whatever the record. Dashed names like
// `site-loc1-buildings` are entity keys, not ids.
const REGEX_ID_SEGMENT =
	/\/(?:\d+|[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}|[2-7a-z]{13}(?<=\d\w*)|(?=\w*\d)\w{16,})(?=\/|$)/gi

export const idless = (path: string) => path.replace(REGEX_ID_SEGMENT, '/[id]')

function refererPath(referer: unknown) {
	if (typeof referer !== 'string' || !referer) return undefined
	try {
		return idless(new URL(referer).pathname)
	} catch {
		return undefined
	}
}

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
	// Same request, same answer: computed once, not on each of its queries.
	let ctx = contexts.get(r)
	if (!ctx) contexts.set(r, (ctx = requestContext(r)))
	return ctx ?? undefined
}

const contexts = new WeakMap<object, RequestContext | null>()

function requestContext(r: any): RequestContext | null {
	if (r.url instanceof URL) {
		const id: string | null | undefined = r.route?.id
		const path = id && !REGEX_CATCH_ALL.test(id) ? id : idless(r.url.pathname)
		const headers = r.request?.headers
		// A page load is its own page; anything else (api call, image, endpoint) belongs to the
		// page that asked for it.
		const isDocument =
			headers?.get?.('sec-fetch-dest') === 'document' ||
			(!REGEX_CATCH_ALL.test(id ?? '') && !!headers?.get?.('accept')?.includes('text/html'))
		return {
			route: `${r.request?.method ?? 'GET'} ${path}`,
			page: isDocument ? path : refererPath(headers?.get?.('referer')),
			key: r,
		}
	}
	const url: string | undefined = r.originalUrl ?? r.url
	if (!url) return null
	return {
		route: `${r.method ?? 'GET'} ${idless(url.split('?')[0]!)}`,
		page: refererPath(r.headers?.referer),
		key: r,
	}
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
	// Opened once, written sync: a test run may exit right after its last query.
	const fd = openSync(file, 'a')
	const reqIds = new WeakMap<object, number>()
	// Per process: two captures appended to one file would reuse numbers, `at` tells them apart.
	let nextReq = 1
	const fn: LogFn = (duration, query, args) => {
		if (REGEX_SELECT_START.test(query) && !REGEX_CATALOG.test(query)) {
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
				// undefined fields are dropped by JSON.stringify.
				route: ctx?.route,
				page: ctx?.page,
				req,
			}
			writeSync(fd, JSON.stringify(line) + '\n')
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

// Captured SQL repeats verbatim: hash each distinct string once per process.
const ids = new Map<string, string>()
export function entryId(e: CapturedQuery) {
	let id = ids.get(e.sql)
	if (id === undefined) ids.set(e.sql, (id = queryId(e.sql)))
	return id
}

/** Calls of each query in each request: the base of every N+1 view. */
function perRequest(entries: CapturedQuery[]) {
	const counts = new Map<number, Map<string, number>>()
	for (const e of entries) {
		if (e.req === undefined) continue
		let m = counts.get(e.req)
		if (!m) counts.set(e.req, (m = new Map()))
		const id = entryId(e)
		m.set(id, (m.get(id) ?? 0) + 1)
	}
	return counts
}

export function groupQueries(entries: CapturedQuery[]): QueryGroup[] {
	const groups = new Map<string, QueryGroup>()
	for (const e of entries) {
		const id = entryId(e)
		const sql = normalizeSql(e.sql)
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
	}
	for (const m of perRequest(entries).values()) {
		for (const [id, n] of m) {
			const g = groups.get(id)!
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

/**
 * Per route (or per page: api calls land on the page that made them): how many requests, how
 * many queries each, and the worst repeat (N+1).
 */
export function groupRoutes(entries: CapturedQuery[], by: 'route' | 'page' = 'route'): RouteStat[] {
	const counts = perRequest(entries)
	const routes = new Map<string, { reqs: Set<number>; queries: number; totalMs: number }>()
	for (const e of entries) {
		const name = by === 'page' ? (e.page ?? (e.route ? '(no page)' : undefined)) : e.route
		if (!name || e.req === undefined) continue
		let r = routes.get(name)
		if (!r) routes.set(name, (r = { reqs: new Set(), queries: 0, totalMs: 0 }))
		r.reqs.add(e.req)
		r.queries++
		r.totalMs += e.ms
	}
	return Array.from(routes, ([route, r]) => {
		let worst: RouteStat['mostRepeated'] = null
		for (const req of r.reqs) {
			for (const [id, n] of counts.get(req)!) {
				if (n > 1 && (!worst || n > worst.perRequest)) worst = { id, perRequest: n }
			}
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

/**
 * Queries run by at least `ratio` of all requests (session, current user...): no index makes a
 * round trip free, removing or caching the query does.
 */
export function everyRequestQueries(entries: CapturedQuery[], ratio = 0.5) {
	const counts = perRequest(entries)
	const inReqs = new Map<string, number>()
	for (const m of counts.values())
		for (const id of m.keys()) inReqs.set(id, (inReqs.get(id) ?? 0) + 1)
	const totals = new Map<string, { ms: number; calls: number }>()
	for (const e of entries) {
		if (e.req === undefined) continue
		const id = entryId(e)
		const t = totals.get(id) ?? { ms: 0, calls: 0 }
		t.ms += e.ms
		t.calls++
		totals.set(id, t)
	}
	return [...inReqs]
		.filter(([, n]) => n >= counts.size * ratio)
		.map(([id, n]) => ({
			id,
			ofRequests: n / counts.size,
			calls: totals.get(id)!.calls,
			totalMs: totals.get(id)!.ms,
		}))
		.toSorted((a, b) => b.totalMs - a.totalMs)
}

/** Remult names params `$1..$n`: positional values for a pg driver. */
export const positionalArgs = (args: Record<string, unknown>) =>
	Object.entries(args)
		.sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
		.map(([, v]) => v)
