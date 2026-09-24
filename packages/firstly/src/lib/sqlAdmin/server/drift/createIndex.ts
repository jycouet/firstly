import { dbNamesOf, type ClassType, type MembersOnly } from 'remult'

import { stripIdent } from './ident'

export type IndexOptions = {
	unique?: boolean
	/** Cannot be combined with a transaction (BackendMethod default). */
	concurrently?: boolean
	ifNotExists?: boolean
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
	columns: string[]
	unique?: boolean
	concurrently?: boolean
	ifNotExists?: boolean
	wrap?: (name: string) => string
}): string {
	const wrap = o.wrap ?? ((s) => `"${s}"`)
	const parts = ['CREATE']
	if (o.unique) parts.push('UNIQUE')
	parts.push('INDEX')
	if (o.concurrently) parts.push('CONCURRENTLY')
	if (o.ifNotExists) parts.push('IF NOT EXISTS')
	parts.push(wrap(o.name), 'ON', wrap(o.table), `(${o.columns.map(wrap).join(', ')})`)
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
	const name = opts.name ?? `${opts.unique ? 'FF_UX' : 'FF_IX'}_${table}_${columns.join('_')}`
	return formatCreateIndex({ name, table, columns, ...opts, wrap: db.wrapIdentifier })
}
