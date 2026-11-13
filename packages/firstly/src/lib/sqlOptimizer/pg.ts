import { quoteTable, splitKey } from '../sqlAdmin/server/drift/ident.js'
import { coversCols, sqlIndexBody, type IndexCol, type IndexSpec } from './indexSpec.js'
import { median, summarizePlan, type ExplainJson, type PlanSummary } from './plan.js'
import type { ExistingIndex } from './suggest.js'

/** What we need from a pg client (`pg.Client` / `pg.Pool` fit). */
export type Db = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }> }

export type ExplainResult = {
	/** Median execution time over `runs` (a warm-up run is discarded). */
	ms: number
	planningMs: number
	runsMs: number[]
	plan: PlanSummary
	raw: ExplainJson
}

// Index names may hold dots (`FF_PK_public.user_id`): quote whole, unless already quoted.
const quoteIndexName = (name: string) => (name.includes('"') ? name : `"${name}"`)

/**
 * EXPLAIN (ANALYZE, BUFFERS) a query with indexes created / dropped, all inside one transaction
 * that is rolled back: the database ends exactly as it was. Takes locks on the tables
 * meanwhile - meant for a local / test database.
 */
export async function explainWith(
	db: Db,
	query: { sql: string; params: unknown[] },
	o: { create?: IndexSpec[]; drop?: string[]; runs?: number; timeoutMs?: number } = {},
): Promise<ExplainResult> {
	const runs = Math.max(1, o.runs ?? 3)
	await db.query('BEGIN')
	try {
		await db.query(`SET LOCAL statement_timeout = ${Math.trunc(o.timeoutMs ?? 60_000)}`)
		for (const name of o.drop ?? []) await db.query(`DROP INDEX ${quoteIndexName(name)}`)
		for (const [i, spec] of (o.create ?? []).entries()) {
			await db.query(
				`CREATE ${spec.unique ? 'UNIQUE ' : ''}INDEX "ffopt_${i + 1}" ON ${quoteTable(spec.table)} ${sqlIndexBody(spec)}`,
			)
		}
		const explain = async () => {
			const res = await db.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query.sql}`, query.params)
			const plan = res.rows[0]['QUERY PLAN']
			return (typeof plan === 'string' ? JSON.parse(plan) : plan)[0] as ExplainJson
		}
		await explain()
		const all: ExplainJson[] = []
		for (let i = 0; i < runs; i++) all.push(await explain())
		const runsMs = all.map((r) => r['Execution Time'])
		const ms = median(runsMs)
		const raw = all.reduce((a, b) =>
			Math.abs(b['Execution Time'] - ms) < Math.abs(a['Execution Time'] - ms) ? b : a,
		)
		return {
			ms,
			planningMs: median(all.map((r) => r['Planning Time'])),
			runsMs,
			plan: summarizePlan(raw),
			raw,
		}
	} finally {
		await db.query('ROLLBACK')
	}
}

const tableFilterSql = (tableArg: number) => `c.oid = to_regclass($${tableArg})`

/** Every key column of every index of `table`, with its ordering. */
export async function existingIndexes(
	db: Db,
	table: string,
): Promise<(ExistingIndex & IndexInfo)[]> {
	const res = await db.query(
		`
		SELECT i.relname AS name, ix.indisunique AS unique, ix.indisprimary AS primary,
			pg_relation_size(i.oid) AS bytes, coalesce(s.idx_scan, 0)::bigint AS scans,
			pg_get_indexdef(i.oid) AS def, ix.indpred IS NOT NULL AS partial,
			array_agg(pg_get_indexdef(i.oid, k.ord::int, true) ORDER BY k.ord) AS cols,
			array_agg(ix.indoption[k.ord - 1] ORDER BY k.ord) AS opts
		FROM pg_class c
		JOIN pg_index ix ON ix.indrelid = c.oid
		JOIN pg_class i ON i.oid = ix.indexrelid
		LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
		CROSS JOIN LATERAL generate_series(1, ix.indnkeyatts) AS k(ord)
		WHERE ${tableFilterSql(1)}
		GROUP BY i.relname, i.oid, ix.indisunique, ix.indisprimary, ix.indpred, s.idx_scan
		ORDER BY i.relname`,
		[quoteTable(table)],
	)
	return res.rows.map((r) => ({
		name: r.name,
		unique: r.unique,
		primary: r.primary,
		partial: r.partial,
		bytes: Number(r.bytes),
		scans: Number(r.scans),
		def: r.def,
		cols: (r.cols as string[]).map((col, i) => {
			// indoption bits: 1 = DESC, 2 = NULLS FIRST
			const opt = Number((r.opts as number[])[i])
			const c: IndexCol = { col: col.replaceAll('"', '') }
			if (opt & 1) c.desc = true
			if (!!(opt & 2) !== !!(opt & 1)) c.nulls = opt & 2 ? 'first' : 'last'
			return c
		}),
	}))
}

type IndexInfo = {
	unique: boolean
	primary: boolean
	partial: boolean
	bytes: number
	/** `idx_scan` since the last stats reset. */
	scans: number
	def: string
}

export async function tableSchema(db: Db, table: string) {
	const t = await db.query(
		`
		SELECT c.reltuples::bigint AS rows_estimate, pg_total_relation_size(c.oid) AS bytes,
			s.n_live_tup AS live_rows, s.seq_scan, s.idx_scan, s.seq_tup_read,
			EXISTS (SELECT 1 FROM pg_stats st WHERE st.schemaname = n.nspname AND st.tablename = c.relname) AS has_stats
		FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
		LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
		WHERE ${tableFilterSql(1)}`,
		[quoteTable(table)],
	)
	if (t.rows.length === 0) throw new Error(`Table not found: ${table}`)
	const { schema, table: name } = splitKey(table)
	const cols = await db.query(
		`
		SELECT a.attname AS col, format_type(a.atttypid, a.atttypmod) AS type,
			NOT a.attnotnull AS nullable, st.null_frac, st.n_distinct, st.correlation
		FROM pg_class c
		JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
		LEFT JOIN pg_stats st ON st.schemaname = $2 AND st.tablename = $3 AND st.attname = a.attname
		WHERE ${tableFilterSql(1)}
		ORDER BY a.attnum`,
		[quoteTable(table), schema ?? 'public', name],
	)
	const r = t.rows[0]
	const indexes = await existingIndexes(db, table)
	return {
		table,
		// reltuples is exact after ANALYZE; the stats counters lag behind (or are reset).
		rows: Math.max(Number(r.rows_estimate), Number(r.live_rows ?? 0)),
		bytes: Number(r.bytes),
		seqScans: Number(r.seq_scan ?? 0),
		idxScans: Number(r.idx_scan ?? 0),
		seqTupRead: Number(r.seq_tup_read ?? 0),
		/** false = no planner stats: estimates are guesses, run `ANALYZE` first. */
		analyzed: r.has_stats as boolean,
		columns: cols.rows.map((c) => ({
			col: c.col as string,
			type: c.type as string,
			nullable: c.nullable as boolean,
			nullFrac: c.null_frac === null ? null : Number(c.null_frac),
			/** < 0: fraction of rows (-1 = unique). */
			nDistinct: c.n_distinct === null ? null : Number(c.n_distinct),
			correlation: c.correlation === null ? null : Number(c.correlation),
		})),
		indexes,
		/** Columns with a single-column unique index. */
		uniqueCols: indexes
			.filter((i) => i.unique && !i.partial && i.cols.length === 1)
			.map((i) => i.cols[0]!.col),
	}
}

/** Index hygiene over every user table. */
export async function auditIndexes(db: Db, o: { minRows?: number } = {}) {
	const minRows = o.minRows ?? 1000
	const tables = await db.query(`
		SELECT CASE WHEN schemaname = 'public' THEN relname ELSE schemaname || '.' || relname END AS table,
			greatest(n_live_tup, (SELECT reltuples::bigint FROM pg_class WHERE oid = relid)) AS rows, seq_scan, seq_tup_read, coalesce(idx_scan, 0) AS idx_scan,
			EXISTS (SELECT 1 FROM pg_stats st WHERE st.schemaname = t.schemaname AND st.tablename = t.relname) AS has_stats
		FROM pg_stat_user_tables t ORDER BY seq_tup_read DESC`)
	const reset = await db.query(
		`SELECT stats_reset FROM pg_stat_database WHERE datname = current_database()`,
	)

	const unused: { table: string; index: string; bytes: number }[] = []
	const redundant: { table: string; index: string; coveredBy: string }[] = []
	for (const t of tables.rows) {
		const ixs = await existingIndexes(db, t.table)
		for (const ix of ixs) {
			if (ix.unique || ix.primary) continue
			if (ix.scans === 0) unused.push({ table: t.table, index: ix.name, bytes: ix.bytes })
			const by = ixs.find(
				(o) => o.name !== ix.name && !o.partial && !ix.partial && coversCols(ix.cols, o.cols),
			)
			if (by) redundant.push({ table: t.table, index: ix.name, coveredBy: by.name })
		}
	}
	return {
		/** Usage counters start here (reset, crash, or clone). */
		statsReset: (reset.rows[0]?.stats_reset as Date | null) ?? null,
		note:
			'unused / seqScanHeavy count since statsReset (null: since the cluster started; a crash wipes them too), any session included (sql-opt EXPLAIN, your own queries): meaningful only after a representative run',
		unused,
		redundant,
		seqScanHeavy: tables.rows
			.filter((t) => Number(t.rows) >= minRows && Number(t.seq_scan) > Number(t.idx_scan))
			.map((t) => ({
				table: t.table as string,
				rows: Number(t.rows),
				seqScans: Number(t.seq_scan),
				idxScans: Number(t.idx_scan),
				seqTupRead: Number(t.seq_tup_read),
			})),
		neverAnalyzed: tables.rows
			.filter((t) => !t.has_stats && Number(t.rows) > 0)
			.map((t) => t.table as string),
	}
}
