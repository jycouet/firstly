import { dbNamesOf, repo, type ClassType, type SqlDatabase } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { execStmt, liveTables } from './catalog'
import { formatCreateIndex } from './createIndex'
import { splitKey, stripIdent, tableKey, tableKeySql, USER_SCHEMA_SQL } from './ident'

/** A toOne relation's local FK columns that ideally have a covering index. */
export type RelIndexDesired = { table: string; columns: string[]; nullable: boolean[] }

/**
 * An existing index from the catalog, columns in order. `nullsFirst[i]`: NULLs come first
 * when scanned ascending (`NULLS FIRST`, or `DESC NULLS LAST` read backward).
 */
export type ExistingIndex = { name: string; cols: string[]; nullsFirst: boolean[] }

export type RelIndexPlan = {
	table: string
	columns: string[]
	name: string
	action: 'ok' | 'create' | 'missing'
	/** name of the index already covering these columns (when action is 'ok'). */
	coveredBy: string | null
	sql: string | null
}

/**
 * `want` is covered if it's a leftmost prefix of `have` (so the PK covers its own prefix),
 * with the NULL order sorts use on nullable columns: Postgres won't follow an index whose
 * NULL order differs.
 */
const covers = (want: RelIndexDesired, have: ExistingIndex, nullsFirst: boolean) =>
	have.cols.length >= want.columns.length &&
	want.columns.every(
		(c, i) => have.cols[i] === c && (!want.nullable[i] || have.nullsFirst[i] === nullsFirst),
	)

/**
 * Pure: for each (deduped) relation FK, decide whether an index is missing.
 * A relation is already covered if any existing index - including the PRIMARY KEY -
 * has those columns as its leftmost prefix, so we never propose redundant indexes
 * (e.g. an `a` index on an `(a, b)` PK table). A table never created is `missing`.
 */
export function planRelationIndexes(
	desired: RelIndexDesired[],
	existing: Map<string, ExistingIndex[]>,
	tables: ReadonlySet<string>,
	opts?: { nullsFirst?: boolean },
): RelIndexPlan[] {
	const nullsFirst = !!opts?.nullsFirst
	const seen = new Set<string>()
	const plans: RelIndexPlan[] = []

	for (const d of desired) {
		const key = `${d.table}(${d.columns.join(',')})`
		if (seen.has(key)) continue
		seen.add(key)

		const colNullsFirst = d.nullable.map((n) => nullsFirst && n)
		const name = `FF_IX_${d.table}_${d.columns.join('_')}${colNullsFirst.some(Boolean) ? '_NF' : ''}`
		if (!tables.has(d.table)) {
			plans.push({
				table: d.table,
				columns: d.columns,
				name,
				action: 'missing',
				coveredBy: null,
				sql: null,
			})
			continue
		}
		const cover = (existing.get(d.table) ?? []).find((e) => covers(d, e, nullsFirst))

		plans.push(
			cover
				? { table: d.table, columns: d.columns, name, action: 'ok', coveredBy: cover.name, sql: null }
				: {
						table: d.table,
						columns: d.columns,
						name,
						action: 'create',
						coveredBy: null,
						sql: formatCreateIndex({
							name,
							...splitKey(d.table),
							columns: d.columns,
							ifNotExists: true,
							nullsFirst: colNullsFirst,
						}),
					},
		)
	}

	return plans
}

/** FK columns of each entity's `toOne` relations - the indexes we'd like to exist. */
export async function relationIndexTargets(
	entities: ClassType<unknown>[],
): Promise<RelIndexDesired[]> {
	const desired: RelIndexDesired[] = []
	for (const ent of entities) {
		const meta = repo(ent).metadata
		if (meta.options.sqlExpression) continue // views: no real table
		const names = await dbNamesOf(ent)
		const table = tableKey(names.$entityName)
		for (const field of meta.fields.toArray()) {
			const fi = getRelationFieldInfo(field)
			if (!fi || fi.type !== 'toOne') continue // toMany is indexed from the toOne side
			const localKeys = Object.values(fi.getFields().fields) // FK columns on THIS entity
			if (localKeys.length === 0) continue
			// A computed key (sqlExpression / serverExpression) has no column to index.
			const computed = localKeys.some((k) => {
				const o = meta.fields.find(k)?.options
				return !!(o?.sqlExpression || o?.serverExpression)
			})
			if (computed) continue
			desired.push({
				table,
				columns: localKeys.map((k) => stripIdent(names.$dbNameOf(k))),
				nullable: localKeys.map((k) => !!meta.fields.find(k)?.options.allowNull),
			})
		}
	}
	return desired
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
	const desired = await relationIndexTargets(entities)

	// Every existing index (incl. PK), columns in order, per table.
	const res = await db.createCommand().execute(`
		SELECT ${tableKeySql('ns.nspname', 'c.relname')} AS table_key, i.relname AS index_name,
			array_agg(a.attname::text ORDER BY k.ord) AS cols,
			-- indoption: bit 1 = DESC, bit 2 = NULLS FIRST
			array_agg(((ix.indoption[k.ord - 1] & 1) <> 0) <> ((ix.indoption[k.ord - 1] & 2) <> 0)
				ORDER BY k.ord) AS nulls_first
		FROM pg_class c
		JOIN pg_namespace ns ON ns.oid = c.relnamespace AND ${USER_SCHEMA_SQL('ns.nspname')}
		JOIN pg_index ix ON ix.indrelid = c.oid
		JOIN pg_class i ON i.oid = ix.indexrelid
		JOIN unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
		JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
		WHERE c.relkind = 'r' AND k.attnum > 0
		GROUP BY ns.nspname, c.relname, i.relname;
	`)
	const existing = new Map<string, ExistingIndex[]>()
	for (const row of res.rows) {
		const list = existing.get(row.table_key) ?? []
		list.push({ name: row.index_name, cols: row.cols, nullsFirst: row.nulls_first })
		existing.set(row.table_key, list)
	}

	const tables = await liveTables(db)

	// remult keeps the provider's `orderByNullsFirst` off SqlDatabase's public type.
	const nullsFirst = !!(
		db as unknown as { _getSourceSql?: () => { orderByNullsFirst?: boolean } }
	)._getSourceSql?.().orderByNullsFirst
	const plans = planRelationIndexes(desired, existing, tables, { nullsFirst })

	if (opts?.apply) {
		for (const plan of plans) if (plan.sql) await execStmt(db, plan.sql)
	}

	return { applied: opts?.apply ?? false, plans }
}
