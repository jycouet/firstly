/** pg catalog / metadata names can come back quoted or schema-qualified. */
export const stripIdent = (name: string) => name.replaceAll('"', '').split('.').pop()!

/**
 * Table key shared by metadata and catalog sides of every diff: bare name in `public`,
 * `schema.name` elsewhere - so an entity in another schema is neither lost nor
 * mistaken for a same-named `public` table.
 */
export function tableKey(dbName: string) {
	const [name, schema] = dbName.replaceAll('"', '').split('.').toReversed()
	return schema && schema !== 'public' ? `${schema}.${name}` : name!
}

/** Same key, computed in SQL from a schema and a table column. */
export const tableKeySql = (schema: string, table: string) =>
	`CASE WHEN ${schema} = 'public' THEN ${table} ELSE ${schema} || '.' || ${table} END`

export function splitKey(key: string): { schema?: string; table: string } {
	const dot = key.indexOf('.')
	return dot === -1 ? { table: key } : { schema: key.slice(0, dot), table: key.slice(dot + 1) }
}

/** Quoted, schema-qualified SQL reference for a `tableKey`. */
export function quoteTable(key: string) {
	const { schema, table } = splitKey(key)
	return schema ? `"${schema}"."${table}"` : `"${table}"`
}

/** Schemas the drift checks read: every user schema, not the system ones. */
export const USER_SCHEMA_SQL = (schema: string) =>
	`${schema} NOT IN ('pg_catalog', 'information_schema') AND ${schema} NOT LIKE 'pg\\_toast%'`
