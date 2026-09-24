import { dbNamesOf, repo, type ClassType, type SqlDatabase } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { formatCreateIndex } from './createIndex'
import { stripIdent } from './ident'

/** A toOne relation's local FK columns that ideally have a covering index. */
export type RelIndexDesired = { table: string; columns: string[] }

/** An existing index from the catalog, columns in order. */
export type ExistingIndex = { name: string; cols: string[] }

export type RelIndexPlan = {
	table: string
	columns: string[]
	name: string
	action: 'ok' | 'create'
	/** name of the index already covering these columns (when action is 'ok'). */
	coveredBy: string | null
	sql: string | null
}

/** `want` is covered if it's a leftmost prefix of `have` (so the PK covers its own prefix). */
const isPrefix = (want: string[], have: string[]) =>
	have.length >= want.length && want.every((c, i) => have[i] === c)

/**
 * Pure: for each (deduped) relation FK, decide whether an index is missing.
 * A relation is already covered if any existing index - including the PRIMARY KEY -
 * has those columns as its leftmost prefix, so we never propose redundant indexes
 * (e.g. an `a` index on an `(a, b)` PK table).
 */
export function planRelationIndexes(
	desired: RelIndexDesired[],
	existing: Map<string, ExistingIndex[]>,
): RelIndexPlan[] {
	const seen = new Set<string>()
	const plans: RelIndexPlan[] = []

	for (const d of desired) {
		const key = `${d.table}(${d.columns.join(',')})`
		if (seen.has(key)) continue
		seen.add(key)

		const name = `FF_IX_${d.table}_${d.columns.join('_')}`
		const cover = (existing.get(d.table) ?? []).find((e) => isPrefix(d.columns, e.cols))

		plans.push(
			cover
				? { table: d.table, columns: d.columns, name, action: 'ok', coveredBy: cover.name, sql: null }
				: {
						table: d.table,
						columns: d.columns,
						name,
						action: 'create',
						coveredBy: null,
						sql: formatCreateIndex({ name, table: d.table, columns: d.columns, ifNotExists: true }),
					},
		)
	}

	return plans
}

/**
 * Find - and optionally create - indexes for `toOne` relation FK columns that
 * aren't already covered by an existing index. Default is a dry run: returns the
 * plan, changes nothing. Pass `{ apply: true }` to create the missing ones.
 *
 * Postgres does NOT auto-index FK columns, and `toMany` relations are indexed
 * from their owning `toOne` side, so only `toOne` is considered. Creates use
 * `CREATE INDEX IF NOT EXISTS` (idempotent), so they join the BackendMethod's
 * transaction - which is also why they can't be `CONCURRENTLY`.
 */
export async function createRelationIndexes(
	db: SqlDatabase,
	entities: ClassType<unknown>[],
	opts?: { apply?: boolean },
): Promise<{ applied: boolean; plans: RelIndexPlan[] }> {
	// Desired FK indexes from each entity's toOne relations.
	const desired: RelIndexDesired[] = []
	for (const ent of entities) {
		const meta = repo(ent).metadata
		if (meta.options.sqlExpression) continue // views: no real table
		const names = await dbNamesOf(ent)
		const table = stripIdent(names.$entityName)
		for (const field of meta.fields.toArray()) {
			const fi = getRelationFieldInfo(field)
			if (!fi || fi.type !== 'toOne') continue // toMany is indexed from the toOne side
			const localKeys = Object.values(fi.getFields().fields) // FK columns on THIS entity
			if (localKeys.length === 0) continue
			desired.push({ table, columns: localKeys.map((k) => stripIdent(names.$dbNameOf(k))) })
		}
	}

	// Every existing index (incl. PK), columns in order, per table.
	const res = await db.createCommand().execute(`
		SELECT c.relname AS table_name, i.relname AS index_name,
			array_agg(a.attname::text ORDER BY k.ord) AS cols
		FROM pg_class c
		JOIN pg_namespace ns ON ns.oid = c.relnamespace AND ns.nspname = 'public'
		JOIN pg_index ix ON ix.indrelid = c.oid
		JOIN pg_class i ON i.oid = ix.indexrelid
		JOIN unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
		JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
		WHERE c.relkind = 'r' AND k.attnum > 0
		GROUP BY c.relname, i.relname;
	`)
	const existing = new Map<string, ExistingIndex[]>()
	for (const row of res.rows) {
		const list = existing.get(row.table_name) ?? []
		list.push({ name: row.index_name, cols: row.cols })
		existing.set(row.table_name, list)
	}

	const plans = planRelationIndexes(desired, existing)

	if (opts?.apply) {
		for (const plan of plans) if (plan.sql) await db.createCommand().execute(plan.sql)
	}

	return { applied: opts?.apply ?? false, plans }
}
