// Index tooling for agents: every command prints JSON. `sql-opt help` for usage.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import {
	groupQueries,
	everyRequestQueries,
	groupRoutes,
	positionalArgs,
	entryId,
	readCapture,
	type CapturedQuery,
	type QueryGroup,
} from './capture.js'
import { indexDdl } from './ddl.js'
import { formatIndexSpec, parseIndexSpecs, type IndexSpec } from './indexSpec.js'
import { parseQuery } from './parseQuery.js'
import { auditIndexes, explainWith, tableSchema, type Db } from './pg.js'
import { suggestIndexes } from './suggest.js'

const HELP = `sql-opt - find the right Postgres indexes from captured queries (JSON out)

Capture: SqlDatabase.LogToConsole = withSqlCapture(...) + FF_SQL_CAPTURE=tmp/sql-capture.jsonl

  top [--by total|mean|max|calls] [--limit 20] [--explain] [--full] [--route <part>]
                                                 hot queries, grouped, with ids, share of the
                                                 captured ms, routes, maxPerRequest (N+1)
                                                 --explain: + dbMs (EXPLAIN ANALYZE, no pool wait)
  routes [--limit 20] [--page]                   per route (--page: per page the user was on,
                                                 api calls included): requests, queries and ms per
                                                 request, the most repeated query in one request,
                                                 and the queries nearly every request runs
  show <id>                                      full sql, slowest args, parsed shape
  schema <table>                                 rows, column stats, indexes (+ usage)
  suggest <id>                                   candidate indexes (starting points)
  explain <id> [--index "<spec>"]... [--drop <index>]... [--raw]
  compare <id> [--variant "<spec>"]... [--calls <n>]
                                                 baseline vs each variant (default: suggestions;
                                                 --variant replaces them), impact = calls x ms saved
                                                 --calls: real frequency (prod pg_stat_statements)
  report <compare.json>... [--md]                winners ranked by impact (saved ms), not speedup
  audit                                          unused / redundant indexes, seq-scan heavy tables
  ddl <table> "<spec>"                           CREATE INDEX + initApi line (sqlCreateIndex)

  <spec>: "a, b desc nulls first"     btree columns
          "other_table: a, b"         another table than the query's
          "unique a"                  unique index
          "using gin ((\\"x\\"::jsonb))"  raw: anything after ON <table> (gin, (expr),
          "(a) where \\"b\\" is null"     partial, include)
          "a, b + other: c"           several indexes tested together
  <id> can be replaced by --sql "<select ...>" [--args '{"$1": 1}']
  --file <jsonl>   capture (default: $FF_SQL_CAPTURE, else tmp/sql-capture.jsonl)
  --url <pg url>   database (default: $DATABASE_URL, .env read if present)
  --runs <n>       timed runs per plan, median kept (default 3)
  --exclude <id>   drop a query from the capture (dev-only, test noise...), repeatable

Indexes are created and dropped inside a rolled back transaction: the database is left as is.
Use a local database with realistic volume: on a tiny table a Seq Scan IS the best plan.`

const MIN_SPEEDUP = 1.2
/** Under this baseline, timer jitter is of the same order as any gain. */
const FAST_MS = 0.2
/** Variants within this of the fastest tie: the simplest one wins. */
const TIE_RATIO = 1.1

const { values: flags, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		by: { type: 'string', default: 'total' },
		limit: { type: 'string', default: '20' },
		explain: { type: 'boolean', default: false },
		full: { type: 'boolean', default: false },
		route: { type: 'string' },
		calls: { type: 'string' },
		md: { type: 'boolean', default: false },
		page: { type: 'boolean', default: false },
		exclude: { type: 'string', multiple: true },
		index: { type: 'string', multiple: true },
		variant: { type: 'string', multiple: true },
		drop: { type: 'string', multiple: true },
		runs: { type: 'string', default: '3' },
		raw: { type: 'boolean', default: false },
		sql: { type: 'string' },
		args: { type: 'string' },
		file: { type: 'string' },
		url: { type: 'string' },
		help: { type: 'boolean', short: 'h' },
	},
})

// pnpm runs scripts from the package dir: paths are relative to where the user typed.
const cwd = process.env.INIT_CWD ?? process.cwd()
const out = (x: unknown) => console.info(JSON.stringify(x, null, 2))
const fail = (msg: string): never => {
	console.error(msg)
	process.exit(2)
}
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e))
const round = (n: number, d = 3) => +n.toFixed(d)

let captured: CapturedQuery[] | undefined
function entries() {
	if (captured) return captured
	const file = resolve(cwd, flags.file ?? process.env.FF_SQL_CAPTURE ?? 'tmp/sql-capture.jsonl')
	if (!existsSync(file)) fail(`No capture at ${file}. Set FF_SQL_CAPTURE and run the app / tests.`)
	const skip = flags.exclude ?? []
	return (captured = readCapture(file).filter((e) => !skip.some((id) => entryId(e).startsWith(id))))
}
const groups = () => groupQueries(entries())
const sumMs = (es: CapturedQuery[]) => es.reduce((n, e) => n + e.ms, 0)
const capturedMs = () => sumMs(entries())
const pct = (part: number, all: number) => {
	const p = all ? (100 * part) / all : 0
	return `${p > 0 && p < 0.1 ? '<0.1' : round(p, 1)}%`
}
const topRoutes = (routes: Record<string, number>, n = 3) =>
	Object.entries(routes)
		.toSorted((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([r, c]) => `${r} (${c})`)

function target(id?: string): QueryGroup {
	if (flags.sql) {
		const args = flags.args ? (JSON.parse(flags.args) as Record<string, unknown>) : {}
		return {
			id: 'adhoc',
			sql: flags.sql,
			table: parseQuery(flags.sql).table,
			calls: 1,
			totalMs: 0,
			meanMs: 0,
			maxMs: 0,
			args,
			routes: {},
			maxPerRequest: 1,
		}
	}
	if (!id) fail('Missing <id> (see `top`) or --sql')
	const g = groups().find((q) => q.id.startsWith(id!))
	return g ?? fail(`No query ${id} in the capture`)
}

async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
	const envFile = resolve(cwd, '.env')
	if (!flags.url && !process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile)
	const url = flags.url ?? process.env.DATABASE_URL
	if (!url) fail('No database: --url or DATABASE_URL')
	const pg = await import('pg').catch(() =>
		fail('sql-opt needs the `pg` package (already there with remult/postgres): pnpm add -D pg'),
	)
	const client = new pg.default.Client({ connectionString: url })
	await client.connect()
	try {
		return await fn(client)
	} finally {
		await client.end()
	}
}

type Schema = Awaited<ReturnType<typeof tableSchema>>
function schemas(db: Db) {
	const cache = new Map<string, Promise<Schema | null>>()
	return (table: string) => {
		if (!cache.has(table))
			cache.set(
				table,
				tableSchema(db, table).catch(() => null),
			)
		return cache.get(table)!
	}
}
const nullableOf = (s: Schema | null) =>
	s ? Object.fromEntries(s.columns.map((c) => [c.col, c.nullable])) : undefined

/** Columns a spec names that its table doesn't have: the parser picked up an alias or a join. */
async function unknownCols(specs: IndexSpec[], schemaOf: (t: string) => Promise<Schema | null>) {
	const missing: string[] = []
	for (const s of specs) {
		const schema = await schemaOf(s.table)
		if (!schema) {
			missing.push(`table ${s.table}`)
			continue
		}
		const cols = new Set(schema.columns.map((c) => c.col))
		for (const c of s.cols) if (!cols.has(c.col)) missing.push(`${s.table}.${c.col}`)
	}
	return missing
}

async function candidates(db: Db, q: QueryGroup, schemaOf = schemas(db)) {
	const parsed = parseQuery(q.sql)
	const schema = parsed.table ? await schemaOf(parsed.table) : null
	if (!schema) return { parsed, candidates: [] }
	return {
		parsed,
		rows: schema.rows,
		analyzed: schema.analyzed,
		candidates: suggestIndexes(parsed, {
			existing: schema.indexes,
			columns: schema.columns.map((c) => c.col),
			unique: [
				...schema.uniqueCols,
				...schema.columns.filter((c) => c.nDistinct === -1).map((c) => c.col),
			],
		}),
	}
}

const [cmd, ...rest] = positionals
const runs = Number(flags.runs)

if (flags.help || !cmd || cmd === 'help') {
	console.info(HELP)
} else if (cmd === 'top') {
	const key = ({ total: 'totalMs', mean: 'meanMs', max: 'maxMs', calls: 'calls' } as const)[
		flags.by as 'total'
	]
	if (!key) fail(`--by: total | mean | max | calls`)
	// --route: calls and ms of that route only, not of the whole capture.
	const scoped = flags.route
		? entries().filter((e) => e.route?.includes(flags.route!) || e.page?.includes(flags.route!))
		: entries()
	const all = groupQueries(scoped)
	const allMs = sumMs(scoped)
	const hasContext = scoped.some((e) => e.req !== undefined)
	const top = all.toSorted((a, b) => b[key] - a[key]).slice(0, Number(flags.limit))
	const dbMs = new Map<string, { dbMs?: number; plan?: string[]; error?: string }>()
	if (flags.explain) {
		await withDb(async (db) => {
			for (const g of top) {
				try {
					const r = await explainWith(db, { sql: g.sql, params: positionalArgs(g.args) }, { runs: 1 })
					const flagsOf = [
						...r.plan.seqScans.map((t) => `seq scan ${t}`),
						...(r.plan.sorts.length ? ['sort'] : []),
					]
					dbMs.set(g.id, { dbMs: round(r.ms), plan: flagsOf })
				} catch (e) {
					dbMs.set(g.id, { error: errMsg(e) })
				}
			}
		})
	}
	out({
		queries: all.length,
		...(flags.explain
			? {
					note:
						'meanMs is app round trip (pool wait included), dbMs is EXPLAIN ANALYZE: a big gap is not an index problem',
				}
			: {}),
		capturedMs: round(allMs, 1),
		top: top.map(({ args: _, sql, routes, maxPerRequest, ...g }) => ({
			...g,
			share: pct(g.totalMs, allMs),
			totalMs: round(g.totalMs, 1),
			meanMs: round(g.meanMs, 2),
			maxMs: round(g.maxMs, 2),
			...dbMs.get(g.id),
			...(hasContext ? { routes: topRoutes(routes), maxPerRequest } : {}),
			sql: !flags.full && sql.length > 240 ? sql.slice(0, 240) + '…' : sql,
		})),
	})
} else if (cmd === 'routes') {
	const allMs = capturedMs()
	const stats = groupRoutes(entries(), flags.page ? 'page' : 'route')
	if (stats.length === 0)
		fail('No route in the capture: it predates request context, or ran outside a remult request')
	out({
		requests: stats.reduce((n, r) => n + r.requests, 0),
		capturedMs: round(allMs, 1),
		note:
			'mostRepeated.perRequest > 2: same query many times in one request, likely N+1 (show <id>). everyRequest: run by most requests (auth, current user): cut or cache them, an index cannot',
		routes: stats
			.toSorted((a, b) => b.totalMs - a.totalMs)
			.slice(0, Number(flags.limit))
			.map((r) => ({
				...r,
				share: pct(r.totalMs, allMs),
				totalMs: round(r.totalMs, 1),
				queriesPerRequest: round(r.queriesPerRequest, 1),
				msPerRequest: round(r.msPerRequest, 2),
			})),
		everyRequest: everyRequestQueries(entries()).map((q) => ({
			...q,
			ofRequests: pct(q.ofRequests, 1),
			share: pct(q.totalMs, allMs),
			totalMs: round(q.totalMs, 1),
		})),
	})
} else if (cmd === 'report') {
	if (!rest.length) fail('report <compare.json>...')
	const rows = rest.map((f) => JSON.parse(readFileSync(resolve(cwd, f), 'utf8')))
	// One row per index: the same index winning on several queries adds up.
	const byIndex = new Map<
		string,
		{
			table: string
			index: string
			queries: string[]
			calls: number
			savedMs: number
			capturedMs: number
			perCall: string[]
			routes: Map<string, number>
			queryDbMs: number
		}
	>()
	for (const c of rows.filter((c) => c.winner)) {
		const key = (c.winner.ddl as { name: string }[]).map((d) => d.name).join(' + ')
		let w = byIndex.get(key)
		if (!w) {
			w = {
				table: c.table,
				index: c.winner.cols,
				queries: [],
				calls: 0,
				savedMs: 0,
				capturedMs: 0,
				perCall: [],
				routes: new Map(),
				queryDbMs: 0,
			}
			byIndex.set(key, w)
		}
		w.queries.push(c.id)
		w.calls += c.impact?.calls ?? 0
		w.savedMs += c.impact?.savedMs ?? 0
		w.capturedMs = Math.max(w.capturedMs, c.impact?.capturedMs ?? 0)
		w.perCall.push(`${c.baseline.ms} -> ${c.winner.ms} (x${c.winner.speedup})`)
		w.queryDbMs += c.impact?.queryDbMs ?? 0
		for (const [r, n] of Object.entries((c.impact?.routes ?? {}) as Record<string, number>))
			w.routes.set(r, (w.routes.get(r) ?? 0) + n)
	}
	const wins = Array.from(byIndex.values(), ({ routes, ...w }) => ({
		...w,
		savedMs: round(w.savedMs, 1),
		queryDbMs: round(w.queryDbMs, 1),
		share: w.capturedMs ? pct(w.savedMs, w.capturedMs) : '',
		ofQueryDbMs: w.queryDbMs ? pct(w.savedMs, w.queryDbMs) : '',
		routes: topRoutes(Object.fromEntries(routes)),
	})).toSorted((a, b) => b.savedMs - a.savedMs)
	const none = rows.filter((c) => !c.winner).map((c) => `${c.id} (${c.noWinner})`)
	if (flags.md) {
		const line = (r: (typeof wins)[number]) =>
			`| ${r.table} | \`${r.index}\` | ${r.queries.join(', ')} | ${r.perCall.join('<br>')} ms | ${r.calls} | ${r.savedMs} ms | ${r.share} | ${r.routes[0] ?? ''} |`
		console.info(
			[
				'| table | index | queries | per call | calls | saved | of captured | top route |',
				'|---|---|---|---|---|---|---|---|',
				...wins.map(line),
				...(none.length ? ['', `No winner: ${none.join(', ')}`] : []),
			].join('\n'),
		)
	} else
		out({
			note: 'one row per index, ranked by savedMs = calls x ms saved per call',
			winners: wins,
			noWinner: none,
		})
} else if (cmd === 'show') {
	const q = target(rest[0])
	out({ ...q, parsed: parseQuery(q.sql) })
} else if (cmd === 'schema') {
	if (!rest[0]) fail('schema <table>')
	out(await withDb((db) => tableSchema(db, rest[0]!)))
} else if (cmd === 'suggest') {
	const q = target(rest[0])
	out(await withDb((db) => candidates(db, q)))
} else if (cmd === 'explain') {
	const q = target(rest[0])
	const table = parseQuery(q.sql).table ?? ''
	const create = (flags.index ?? []).flatMap((s) => parseIndexSpecs(s, table))
	const r = await withDb((db) =>
		explainWith(
			db,
			{ sql: q.sql, params: positionalArgs(q.args) },
			{ create, drop: flags.drop, runs },
		),
	)
	out({
		id: q.id,
		created: create.map((c, i) => ({ name: `ffopt_${i + 1}`, spec: formatIndexSpec(c) })),
		...r,
		raw: flags.raw ? r.raw : undefined,
	})
} else if (cmd === 'compare') {
	const q = target(rest[0])
	out(
		await withDb(async (db) => {
			const schemaOf = schemas(db)
			const { parsed, rows, analyzed, candidates: cands } = await candidates(db, q, schemaOf)
			const table = parsed.table ?? ''
			const variants = flags.variant?.length
				? flags.variant.map((s) => ({ specs: parseIndexSpecs(s, table), why: 'given' }))
				: cands.filter((c) => !c.coveredBy).map((c) => ({ specs: [c.spec], why: c.why }))
			const query = { sql: q.sql, params: positionalArgs(q.args) }
			const base = await explainWith(db, query, { runs })
			const results = []
			for (const v of variants) {
				const cols = v.specs.map((s) => formatIndexSpec(s, table)).join(' + ')
				const missing = await unknownCols(v.specs, schemaOf)
				if (missing.length) {
					results.push({ cols, why: v.why, error: `not in the table: ${missing.join(', ')}` })
					continue
				}
				try {
					const r = await explainWith(db, query, { create: v.specs, runs })
					const usesIndex = r.plan.indexes.some((i) => i.startsWith('ffopt_'))
					results.push({
						cols,
						why: v.why,
						specs: v.specs,
						ms: round(r.ms),
						spread: r.spread.map((x) => round(x)),
						usesIndex,
						// Unused index = same plan: any timing gap is noise.
						speedup: usesIndex ? round(base.ms / Math.max(r.ms, 0.001), 2) : null,
						sortRemoved: base.plan.sorts.length > r.plan.sorts.length,
						buffers: r.plan.buffers,
						tree: r.plan.tree,
					})
				} catch (e) {
					results.push({ cols, why: v.why, error: errMsg(e) })
				}
			}
			const ok = results.filter((r) => 'ms' in r && r.ms !== undefined)
			ok.sort((a, b) => a.ms! - b.ms!)
			// Noise floor: the variant's slowest run beats the baseline's fastest one.
			const wins = ok.filter(
				(r) => r.usesIndex && r.speedup! >= MIN_SPEEDUP && r.spread![1]! < base.spread[0],
			)
			const unique = (r: (typeof ok)[number]) => (r.specs!.some((s) => s.unique) ? 1 : 0)
			const size = (r: (typeof ok)[number]) =>
				r.specs!.reduce((n, s) => n + (s.raw ? 3 : s.cols.length), 0)
			const best = wins
				.filter((r) => r.ms! <= wins[0]!.ms! * TIE_RATIO)
				// Unique when the data allows it: a free guard, not a speed choice.
				.toSorted((a, b) => size(a) - size(b) || unique(b) - unique(a) || a.ms! - b.ms!)[0]
			const warnings = [
				...(rows !== undefined && rows < 1000
					? [`${rows} rows: plans on a tiny table don't transfer to production volume`]
					: []),
				...(analyzed === false ? [`${table} has no planner stats: run ANALYZE "${table}" first`] : []),
				...(base.ms < FAST_MS
					? [`baseline ${round(base.ms)} ms: already fast, judge a win by impact.savedMs`]
					: []),
				...(parsed.hasSubquery
					? ['sub-selects were masked: suggestions cover the outer query, read the tree for the rest']
					: []),
			]
			const adhoc = q.id === 'adhoc'
			const calls = flags.calls ? Number(flags.calls) : adhoc ? null : q.calls
			const savedMsPerCall = best ? base.ms - best.ms! : 0
			const allMs = adhoc ? 0 : capturedMs()
			return {
				id: q.id,
				sql: q.sql,
				table,
				rows,
				...(warnings.length ? { warnings } : {}),
				covered: cands
					.filter((c) => c.coveredBy)
					.map((c) => ({ cols: c.cols, coveredBy: c.coveredBy })),
				baseline: {
					ms: round(base.ms),
					spread: base.spread.map((x) => round(x)),
					buffers: base.plan.buffers,
					tree: base.plan.tree,
				},
				variants: [...ok.map(({ specs: _, ...r }) => r), ...results.filter((r) => 'error' in r)],
				...(best
					? {}
					: {
							noWinner: !results.length
								? 'no candidate'
								: !ok.length
									? 'every variant failed'
									: !ok.some((r) => r.usesIndex)
										? 'planner ignored every index'
										: `no variant x${MIN_SPEEDUP} faster with runs clear of the baseline's`,
						}),
				winner: best
					? {
							cols: best.cols,
							ms: best.ms,
							speedup: best.speedup,
							ddl: await Promise.all(
								best.specs!.map(async (s) => indexDdl(s, nullableOf(await schemaOf(s.table)))),
							),
						}
					: null,
				impact: {
					calls,
					callsFrom: flags.calls ? '--calls' : adhoc ? 'adhoc: pass --calls' : 'capture',
					routes: q.routes,
					maxPerRequest: q.maxPerRequest,
					savedMsPerCall: round(savedMsPerCall),
					savedMs: calls === null ? null : round(savedMsPerCall * calls, 1),
					/** This query's DB time over the capture: savedMs / queryDbMs is the DB-side gain. */
					queryDbMs: calls === null ? null : round(base.ms * calls, 1),
					capturedMs: round(allMs, 1),
					// db ms saved over app ms captured (pool wait included): a lower bound of the real share.
					share: flags.calls || adhoc ? undefined : pct(savedMsPerCall * calls!, allMs),
				},
			}
		}),
	)
} else if (cmd === 'audit') {
	out(await withDb((db) => auditIndexes(db)))
} else if (cmd === 'ddl') {
	if (!rest[0] || !rest[1]) fail('ddl <table> "<spec>"')
	out(
		await withDb(async (db) => {
			const schemaOf = schemas(db)
			const specs = parseIndexSpecs(rest[1]!, rest[0]!)
			const missing = await unknownCols(specs, schemaOf)
			if (missing.length) fail(`Not in the table: ${missing.join(', ')}`)
			return Promise.all(specs.map(async (s) => indexDdl(s, nullableOf(await schemaOf(s.table)))))
		}),
	)
} else {
	fail(`Unknown command ${cmd}. sql-opt help`)
}
