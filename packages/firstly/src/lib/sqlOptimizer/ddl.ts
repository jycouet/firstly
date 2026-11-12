import { quoteTable, splitKey } from '../sqlAdmin/server/drift/ident'
import { formatIndexCols, sqlIndexCols, type IndexSpec } from './indexSpec'

/**
 * What to ship for a winning index: the SQL, and - when `sqlCreateIndex` can express it - the
 * `initApi` line using it. `nullable` (column -> allows NULL) decides that: the helper puts the
 * `NullSort` NULL order on allowNull fields only.
 */
export function indexDdl(spec: IndexSpec, nullable?: Record<string, boolean>) {
	const { table } = splitKey(spec.table)
	const nf = spec.cols.some((c) => c.nulls === 'first')
	// Same derived name as `sqlCreateIndex`: re-running either one is a no-op.
	const name = `FF_IX_${table}_${spec.cols.map((c) => c.col).join('_')}${nf ? '_NF' : ''}`
	const sql = `CREATE INDEX IF NOT EXISTS "${name}" ON ${quoteTable(spec.table)} (${sqlIndexCols(spec.cols)});`

	const helperFits = spec.cols.every(
		(c) =>
			!c.desc &&
			c.nulls !== 'last' &&
			(!nullable || (c.nulls === 'first') === (nf && nullable[c.col] !== false)),
	)
	const fields = spec.cols.map((c) => `'${c.col}'`).join(', ')
	return {
		cols: formatIndexCols(spec.cols),
		name,
		sql,
		initApi: helperFits
			? `await SqlDatabase.getDb().execute(await sqlCreateIndex(<EntityOf_${table}>, [${fields}], { ifNotExists: true }))`
			: `await SqlDatabase.getDb().execute(\`${sql}\`)`,
		notes: [
			'sqlCreateIndex is in firstly/sqlAdmin/server; it takes field keys: the columns above are db names, map them back if a field has a dbName.',
			...(helperFits
				? [
						nf
							? 'sqlCreateIndex follows NullSort.order: NULLS FIRST here needs NullSort.order.asc = NULLS FIRST in the app (it is, if the captured SQL has it).'
							: 'sqlCreateIndex follows NullSort.order on allowNull fields: with NULLS FIRST set, it builds the _NF variant, which is what the queries then need.',
					]
				: [
						'sqlCreateIndex cannot express it (DESC, NULLS LAST, or a NULL order on a NOT NULL column): raw SQL.',
					]),
			'Big live table: build it CONCURRENTLY outside a transaction first, then the line above is a no-op.',
		],
	}
}
