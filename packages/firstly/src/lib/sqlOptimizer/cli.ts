// Index tooling for agents: every command prints JSON. `sql-opt help` for usage.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import pg from 'pg'

import { groupQueries, positionalArgs, readCapture, type QueryGroup } from './capture'
import { indexDdl } from './ddl'
import { formatIndexSpec, parseIndexSpecs, type IndexSpec } from './indexSpec'
import { parseQuery } from './parseQuery'
import { auditIndexes, explainWith, tableSchema, type Db } from './pg'
import { suggestIndexes } from './suggest'

const HELP = `sql-opt - find the right Postgres indexes from captured queries (JSON out)

Capture: SqlDatabase.LogToConsole = withSqlCapture(...) + FF_SQL_CAPTURE=tmp/sql-capture.jsonl

  top [--by total|mean|max|calls] [--limit 20] [--explain] [--full]
                                                 hot queries, grouped, with ids
                                                 --explain: + dbMs (EXPLAIN ANALYZE, no pool wait)
  show <id>                                      full sql, slowest args, parsed shape
  schema <table>                                 rows, column stats, indexes (+ usage)
  suggest <id>                                   candidate indexes (starting points)
  explain <id> [--index "<spec>"]... [--drop <index>]... [--raw]
  compare <id> [--variant "<spec>"]...           baseline vs each variant (default: suggestions;
                                                 --variant replaces them)
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

Indexes are created and dropped inside a rolled back transaction: the database is left as is.
Use a local database with realistic volume: on a tiny table a Seq Scan IS the best plan.`

/** Below this, a "win" is timer noise, whatever the ratio. */
const MIN_GAIN_MS = 0.05
const MIN_SPEEDUP = 1.2
/** Variants within this of the fastest tie: the simplest one wins. */
const TIE_RATIO = 1.1

const { values: flags, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		by: { type: 'string', default: 'total' },
		limit: { type: 'string', default: '20' },
		explain: { type: 'boolean', default: false },
		full: { type: 'boolean', default: false },
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

function groups() {
	const file = resolve(cwd, flags.file ?? process.env.FF_SQL_CAPTURE ?? 'tmp/sql-capture.jsonl')
	if (!existsSync(file)) fail(`No capture at ${file}. Set FF_SQL_CAPTURE and run the app / tests.`)
	return groupQueries(readCapture(file))
}

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
	const client = new pg.Client({ connectionString: url })
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

async function candidates(db: Db, q: QueryGroup) {
	const parsed = parseQuery(q.sql)
	if (!parsed.table) return { parsed, candidates: [] }
	const schema = await tableSchema(db, parsed.table)
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
	const all = groups()
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
		top: top.map(({ args: _, sql, ...g }) => ({
			...g,
			totalMs: round(g.totalMs, 1),
			meanMs: round(g.meanMs, 2),
			maxMs: round(g.maxMs, 2),
			...dbMs.get(g.id),
			sql: !flags.full && sql.length > 240 ? sql.slice(0, 240) + '…' : sql,
		})),
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
			const { parsed, rows, analyzed, candidates: cands } = await candidates(db, q)
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
			const wins = ok.filter(
				(r) => r.usesIndex && r.speedup! >= MIN_SPEEDUP && base.ms - r.ms! >= MIN_GAIN_MS,
			)
			const size = (r: (typeof ok)[number]) =>
				r.specs!.reduce((n, s) => n + (s.raw ? 3 : s.cols.length), 0)
			const best = wins
				.filter((r) => r.ms! <= wins[0]!.ms! * TIE_RATIO)
				.toSorted((a, b) => size(a) - size(b) || a.ms! - b.ms!)[0]
			const warnings = [
				...(rows !== undefined && rows < 1000
					? [`${rows} rows: plans on a tiny table don't transfer to production volume`]
					: []),
				...(analyzed === false ? [`${table} has no planner stats: run ANALYZE "${table}" first`] : []),
				...(base.ms < MIN_GAIN_MS * 4
					? [`baseline ${round(base.ms)} ms: already fast, gains below ${MIN_GAIN_MS} ms are ignored`]
					: []),
				...(parsed.hasSubquery
					? ['sub-selects were masked: suggestions cover the outer query, read the tree for the rest']
					: []),
			]
			return {
				id: q.id,
				sql: q.sql,
				table,
				rows,
				...(warnings.length ? { warnings } : {}),
				covered: cands
					.filter((c) => c.coveredBy)
					.map((c) => ({ cols: c.cols, coveredBy: c.coveredBy })),
				baseline: { ms: round(base.ms), buffers: base.plan.buffers, tree: base.plan.tree },
				variants: [...ok.map(({ specs: _, ...r }) => r), ...results.filter((r) => 'error' in r)],
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
