import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { SqlDatabase } from 'remult'

import { normalizeSql, parseQuery } from './parseQuery'

type LogFn = (duration: number, query: string, args: Record<string, any>) => void

export type CapturedQuery = { sql: string; args: Record<string, unknown>; ms: number; at: string }

const REGEX_CATALOG = /\s(from|join)\s+"?(information_schema|pg_)/i

/**
 * Wrap a `SqlDatabase.LogToConsole` fn to also append every SELECT to a JSONL file.
 * No file (env `FF_SQL_CAPTURE` unset) = `inner` untouched, so it can stay wired in.
 *
 * @example
 * SqlDatabase.LogToConsole = withSqlCapture((...a) => FF_LogToConsole(...a))
 */
export function withSqlCapture(inner?: LogFn, file = process.env.FF_SQL_CAPTURE) {
	if (!file) return inner ?? false
	mkdirSync(dirname(file), { recursive: true })
	// Remult only calls LogToConsole above the threshold: capture needs every query.
	const thresholdMs = SqlDatabase.durationThreshold
	SqlDatabase.durationThreshold = 0
	const fn: LogFn = (duration, query, args) => {
		const kind = parseQuery(query).kind
		if ((kind === 'select' || kind === 'count') && !REGEX_CATALOG.test(query)) {
			const line: CapturedQuery = {
				sql: query,
				args,
				ms: duration * 1000,
				at: new Date().toISOString(),
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
	/** Stable across captures: hash of the normalized SQL. */
	id: string
	sql: string
	table: string | null
	calls: number
	totalMs: number
	meanMs: number
	maxMs: number
	/** Args of the slowest call: the one worth replaying. */
	args: Record<string, unknown>
}

export const queryId = (sql: string) =>
	createHash('sha1').update(normalizeSql(sql)).digest('hex').slice(0, 8)

export function groupQueries(entries: CapturedQuery[]): QueryGroup[] {
	const groups = new Map<string, QueryGroup>()
	for (const e of entries) {
		const sql = normalizeSql(e.sql)
		const id = queryId(sql)
		const g = groups.get(id)
		if (!g) {
			groups.set(id, {
				id,
				sql,
				table: parseQuery(sql).table,
				calls: 1,
				totalMs: e.ms,
				meanMs: e.ms,
				maxMs: e.ms,
				args: e.args,
			})
			continue
		}
		g.calls++
		g.totalMs += e.ms
		g.meanMs = g.totalMs / g.calls
		if (e.ms > g.maxMs) {
			g.maxMs = e.ms
			g.args = e.args
		}
	}
	return [...groups.values()]
}

/** Remult names params `$1..$n`: positional values for a pg driver. */
export const positionalArgs = (args: Record<string, unknown>) =>
	Object.entries(args)
		.sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
		.map(([, v]) => v)
