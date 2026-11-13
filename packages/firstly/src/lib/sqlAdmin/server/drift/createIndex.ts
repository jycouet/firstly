import { dbNamesOf, repo, type ClassType, type MembersOnly } from 'remult'
import { NullSort } from 'remult/internals'

import { stripIdent } from './ident'

export type NullSortOrder = typeof NullSort.order

/**
 * One btree is read forward for asc and backward for desc, so `asc` decides its NULL order:
 * `{ asc: 'NULLS FIRST', desc: 'NULLS LAST' }` is one `NULLS FIRST` index. `native` is
 * Postgres' own order: plain index.
 */
export const indexNullsFirst = (order: NullSortOrder = NullSort.order) =>
	order !== 'native' && order.asc === 'NULLS FIRST'

export type IndexOptions = {
	unique?: boolean
	/** Cannot be combined with a transaction (BackendMethod default). */
	concurrently?: boolean
	ifNotExists?: boolean
	/**
	 * Match the sorts, else Postgres skips the index. Applies to `allowNull` fields only;
	 * derived name gets `_NF` when any is `NULLS FIRST`. Defaults to remult's `NullSort.order`.
	 */
	nullSort?: NullSortOrder
	/** Override the derived `FF_IX_<table>_<cols>` / `FF_UX_...` name. */
	name?: string
}

/**
 * Pure `CREATE INDEX` string builder. `name` / `table` / `columns` are raw
 * identifiers; all are wrapped with `wrap` (defaults to PG double-quoting).
 */
export function formatCreateIndex(o: {
	name: string
	table: string
	/** Omit for the search path (usually `public`). */
	schema?: string
	columns: string[]
	unique?: boolean
	concurrently?: boolean
	ifNotExists?: boolean
	/** All columns, or per column. */
	nullsFirst?: boolean | boolean[]
	wrap?: (name: string) => string
}): string {
	const wrap = o.wrap ?? ((s) => `"${s}"`)
	const parts = ['CREATE']
	if (o.unique) parts.push('UNIQUE')
	parts.push('INDEX')
	if (o.concurrently) parts.push('CONCURRENTLY')
	if (o.ifNotExists) parts.push('IF NOT EXISTS')
	const table = o.schema ? `${wrap(o.schema)}.${wrap(o.table)}` : wrap(o.table)
	const nf = (i: number) => (Array.isArray(o.nullsFirst) ? o.nullsFirst[i] : o.nullsFirst)
	const col = (c: string, i: number) => (nf(i) ? `${wrap(c)} NULLS FIRST` : wrap(c))
	parts.push(wrap(o.name), 'ON', table, `(${o.columns.map(col).join(', ')})`)
	return parts.join(' ') + ';'
}

/** `X` <-> `X_NF`: the same derived index under the other NULL order. */
export const otherNullsVariant = (name: string) =>
	name.endsWith('_NF') ? name.slice(0, -3) : `${name}_NF`

/** Pure `DROP INDEX IF EXISTS`, same wrapping as `formatCreateIndex`. */
export function formatDropIndex(o: {
	name: string
	schema?: string
	wrap?: (name: string) => string
}): string {
	const wrap = o.wrap ?? ((s) => `"${s}"`)
	return `DROP INDEX IF EXISTS ${o.schema ? `${wrap(o.schema)}.` : ''}${wrap(o.name)};`
}

/**
 * Build a `CREATE INDEX` for an entity + a typed list of its fields. Resolves
 * the real table / column db-names (and the provider's identifier quoting) via
 * `dbNamesOf`, so it stays refactor-safe when a field's `dbName` is overridden.
 * Returns the SQL only - the caller runs it.
 *
 * With a derived name and a nullable column, it also drops the other NULL-order variant
 * (`X` / `X_NF`), so a `NullSort` change swaps the index instead of leaving a stale one.
 * Not with `concurrently`, which must run alone.
 */
export async function sqlCreateIndex<T>(
	entity: ClassType<T>,
	fields: (keyof MembersOnly<T> & string)[],
	opts: IndexOptions = {},
): Promise<string> {
	const db = await dbNamesOf(entity)
	const table = stripIdent(db.$entityName)
	const columns = fields.map((f) => stripIdent(db.$dbNameOf(f)))
	const fieldsMeta = repo(entity).metadata.fields
	// A NOT NULL column has no NULLs to place.
	const wanted = indexNullsFirst(opts.nullSort)
	const nullable = fields.map((f) => !!fieldsMeta.find(f)?.allowNull)
	const nullsFirst = nullable.map((n) => wanted && n)
	const name =
		opts.name ??
		`${opts.unique ? 'FF_UX' : 'FF_IX'}_${table}_${columns.join('_')}${nullsFirst.some(Boolean) ? '_NF' : ''}`
	const sql = formatCreateIndex({
		name,
		table,
		columns,
		...opts,
		nullsFirst,
		wrap: db.wrapIdentifier,
	})
	if (opts.name || opts.concurrently || !nullable.some(Boolean)) return sql
	return `${sql} ${formatDropIndex({ name: otherNullsVariant(name), wrap: db.wrapIdentifier })}`
}
