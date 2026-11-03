// Index tooling for agents: every command prints JSON. `sql-opt help` for usage.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import pg from 'pg'

import { groupQueries, positionalArgs, readCapture, type QueryGroup } from './capture'
import { indexDdl } from './ddl'
import { parseIndexSpec } from './indexSpec'
import { parseQuery } from './parseQuery'
import { auditIndexes, explainWith, tableSchema, type Db } from './pg'
import { suggestIndexes } from './suggest'

const HELP = `sql-opt - find the right Postgres indexes from captured queries (JSON out)

Capture: SqlDatabase.LogToConsole = withSqlCapture(...) + FF_SQL_CAPTURE=tmp/sql-capture.jsonl

  top [--by total|mean|max|calls] [--limit 20]   hot queries, grouped, with ids
  show <id>                                      full sql, slowest args, parsed shape
  schema <table>                                 rows, column stats, indexes (+ usage)
  suggest <id>                                   candidate indexes (starting points)
  explain <id> [--index "<cols>"]... [--drop <index>]... [--raw]
  compare <id> [--variant "<cols>"]...           baseline vs each variant (default: suggestions)
  audit                                          unused / redundant indexes, seq-scan heavy tables
  ddl <table> "<cols>"                           CREATE INDEX + initApi line (sqlCreateIndex)

  <cols>: "a, b desc nulls first", or "other_table: a, b"
  <id> can be replaced by --sql "<select ...>" [--args '{"$1": 1}']
  --file <jsonl>   capture (default: $FF_SQL_CAPTURE, else tmp/sql-capture.jsonl)
  --url <pg url>   database (default: $DATABASE_URL, .env read if present)
  --runs <n>       timed runs per plan, median kept (default 3)

Indexes are created and dropped inside a rolled back transaction: the database is left as is.
Use a local database with realistic volume: on a tiny table a Seq Scan IS the best plan.`

const { values: flags, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		by: { type: 'string', default: 'total' },
		limit: { type: 'string', default: '20' },
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

async function candidates(db: Db, q: QueryGroup) {
	const parsed = parseQuery(q.sql)
	if (!parsed.table) return { parsed, candidates: [] }
	const schema = await tableSchema(db, parsed.table)
	return {
		parsed,
		rows: schema.rows,
		nullable: Object.fromEntries(schema.columns.map((c) => [c.col, c.nullable])),
		candidates: suggestIndexes(parsed, { existing: schema.indexes }),
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
	out({
		queries: all.length,
		top: all
			.toSorted((a, b) => b[key] - a[key])
			.slice(0, Number(flags.limit))
			.map(({ args: _, sql, ...g }) => ({
				...g,
				totalMs: +g.totalMs.toFixed(1),
				meanMs: +g.meanMs.toFixed(2),
				maxMs: +g.maxMs.toFixed(2),
				sql: sql.length > 240 ? sql.slice(0, 240) + '…' : sql,
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
	const create = (flags.index ?? []).map((s) => parseIndexSpec(s, table))
	const r = await withDb((db) =>
		explainWith(
			db,
			{ sql: q.sql, params: positionalArgs(q.args) },
			{ create, drop: flags.drop, runs },
		),
	)
	out({
		id: q.id,
		created: create.map((c, i) => ({ name: `ffopt_${i + 1}`, ...c })),
		...r,
		raw: flags.raw ? r.raw : undefined,
	})
} else if (cmd === 'compare') {
	const q = target(rest[0])
	out(
		await withDb(async (db) => {
			const { parsed, rows, nullable, candidates: cands } = await candidates(db, q)
			const table = parsed.table ?? ''
			const variants = flags.variant?.length
				? flags.variant.map((s) => ({ cols: s, spec: parseIndexSpec(s, table), why: 'given' }))
				: cands.filter((c) => !c.coveredBy)
			const query = { sql: q.sql, params: positionalArgs(q.args) }
			const base = await explainWith(db, query, { runs })
			const results = []
			for (const v of variants) {
				const r = await explainWith(db, query, { create: [v.spec], runs })
				results.push({
					cols: v.cols,
					table: v.spec.table,
					why: v.why,
					ms: +r.ms.toFixed(3),
					speedup: +(base.ms / Math.max(r.ms, 0.001)).toFixed(2),
					usesIndex: r.plan.indexes.includes('ffopt_1'),
					sortRemoved: base.plan.sorts.length > r.plan.sorts.length,
					buffers: r.plan.buffers,
					tree: r.plan.tree,
				})
			}
			results.sort((a, b) => a.ms - b.ms)
			const best = results.find((r) => r.usesIndex && r.speedup >= 1.2)
			return {
				id: q.id,
				sql: q.sql,
				rows,
				...(rows !== undefined && rows < 1000
					? { warning: `${rows} rows: plans on a tiny table don't transfer to production volume` }
					: {}),
				covered: cands
					.filter((c) => c.coveredBy)
					.map((c) => ({ cols: c.cols, coveredBy: c.coveredBy })),
				baseline: { ms: +base.ms.toFixed(3), buffers: base.plan.buffers, tree: base.plan.tree },
				variants: results,
				winner: best
					? { ...best, ddl: indexDdl(parseIndexSpec(best.cols, best.table), nullable) }
					: null,
			}
		}),
	)
} else if (cmd === 'audit') {
	out(await withDb((db) => auditIndexes(db)))
} else if (cmd === 'ddl') {
	if (!rest[0] || !rest[1]) fail('ddl <table> "<cols>"')
	const spec = parseIndexSpec(rest[1]!, rest[0]!)
	const s = await withDb((db) => tableSchema(db, spec.table))
	out(indexDdl(spec, Object.fromEntries(s.columns.map((c) => [c.col, c.nullable]))))
} else {
	fail(`Unknown command ${cmd}. sql-opt help`)
}
