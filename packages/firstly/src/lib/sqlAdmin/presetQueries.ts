/** Title -> SQL. A built-in title overrides it, `false` removes it, a new title adds a button. */
export type SqlPresetQueries = Record<string, string | false>

export const builtInPresetQueries: Record<string, string> = {
	Default: `SELECT *
FROM "public"."users"
LIMIT 10`,
	'Tables & Sizes': `SELECT
  table_schema,
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_size,
  pg_size_pretty(pg_table_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as data_size,
  pg_size_pretty(pg_indexes_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as index_size
FROM information_schema.tables
WHERE table_schema IN ('public', 'ff_auth')
ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC;`,
	Indexes: `SELECT *
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname`,
	'Database Size': `SELECT
  current_database() as database_name,
  pg_size_pretty(pg_database_size(current_database())) as database_size`,
}

/** Built-ins first (in their order), then added titles in insertion order. */
export function mergePresetQueries(
	queries: SqlPresetQueries = {},
): { title: string; sql: string }[] {
	const merged: SqlPresetQueries = { ...builtInPresetQueries, ...queries }
	return Object.entries(merged).flatMap(([title, sql]) => (sql === false ? [] : [{ title, sql }]))
}
