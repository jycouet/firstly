import { dbNamesOf, repo, type ClassType, type MembersOnly } from 'remult'
import * as internals from 'remult/internals'

import { stripIdent } from './ident'

/**
 * Whether index columns should be `NULLS FIRST`, from remult's app-wide `NullSort.order`.
 * One btree serves asc forward and desc backward, so `asc` decides: `{ asc: 'NULLS FIRST',
 * desc: 'NULLS LAST' }` is served by a `NULLS FIRST` index. `native` is Postgres' own
 * (NULLS LAST on asc): default index.
 */
export function nullsFirstDefault() {
	// TODO: import `NullSort` directly once remult >= 3.5 is the minimum peer
	const nullSort = (internals as { NullSort?: { order: 'native' | { asc: string } } }).NullSort
	const order = nullSort?.order ?? 'native'
	return order !== 'native' && order.asc === 'NULLS FIRST'
}

export type IndexOptions = {
	unique?: boolean
	/** Cannot be combined with a transaction (BackendMethod default). */
	concurrently?: boolean
	ifNotExists?: boolean
	/**
	 * Match `NullSort` sorts, else Postgres skips the index. Applies to `allowNull` fields
	 * only; derived name gets `_NF` when any does. Defaults to `nullsFirstDefault()`.
	 */
	nullsFirst?: boolean
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

/**
 * Build a `CREATE INDEX` for an entity + a typed list of its fields. Resolves
 * the real table / column db-names (and the provider's identifier quoting) via
 * `dbNamesOf`, so it stays refactor-safe when a field's `dbName` is overridden.
 * Returns the SQL only - the caller runs it.
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
	const wanted = opts.nullsFirst ?? nullsFirstDefault()
	const nullsFirst = fields.map((f) => wanted && !!fieldsMeta.find(f)?.allowNull)
	const name =
		opts.name ??
		`${opts.unique ? 'FF_UX' : 'FF_IX'}_${table}_${columns.join('_')}${nullsFirst.some(Boolean) ? '_NF' : ''}`
	return formatCreateIndex({ name, table, columns, ...opts, nullsFirst, wrap: db.wrapIdentifier })
}
