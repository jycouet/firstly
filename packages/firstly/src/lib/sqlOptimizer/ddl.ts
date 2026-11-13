import { quoteTable, splitKey } from '../sqlAdmin/server/drift/ident.js'
import { formatIndexSpec, sqlIndexBody, type IndexSpec } from './indexSpec.js'

const REGEX_NON_IDENT = /[^\w]+/g
const REGEX_EDGE_UNDERSCORES = /^_+|_+$/g

/**
 * What to ship for a winning index: the SQL, and - when `sqlCreateIndex` can express it - the
 * `initApi` line using it. `nullable` (column -> allows NULL) decides that: the helper puts one
 * NULL order on all allowNull fields of the list, and none on the others.
 */
export function indexDdl(spec: IndexSpec, nullable?: Record<string, boolean>) {
	const { table } = splitKey(spec.table)
	const nf = spec.cols.some((c) => c.nulls === 'first')
	const tail = spec.raw
		? spec.raw.replace(REGEX_NON_IDENT, '_').replace(REGEX_EDGE_UNDERSCORES, '').slice(0, 40)
		: `${spec.cols.map((c) => c.col).join('_')}${nf ? '_NF' : ''}`
	// Same derived name as `sqlCreateIndex`: re-running either one is a no-op.
	const name = `${spec.unique ? 'FF_UX' : 'FF_IX'}_${table}_${tail}`
	const sql = `CREATE ${spec.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${name}" ON ${quoteTable(spec.table)} ${sqlIndexBody(spec)};`

	const anyNullable = !!nullable && spec.cols.some((c) => nullable[c.col])
	const helperFits =
		!spec.raw &&
		spec.cols.every(
			(c) =>
				!c.desc &&
				c.nulls !== 'last' &&
				(!nullable || (c.nulls === 'first') === (nf && !!nullable[c.col])),
		)
	const fields = spec.cols.map((c) => `'${c.col}'`).join(', ')
	const opts = [
		'ifNotExists: true',
		...(spec.unique ? ['unique: true'] : []),
		// Explicit: the tested NULL order ships whatever NullSort says at boot.
		...(anyNullable || (!nullable && nf) ? [`nullsFirst: ${nf}`] : []),
	].join(', ')
	return {
		cols: formatIndexSpec(spec, spec.table),
		name,
		sql,
		initApi: helperFits
			? `await SqlDatabase.getDb().execute(await sqlCreateIndex(<EntityOf_${table}>, [${fields}], { ${opts} }))`
			: `await SqlDatabase.getDb().execute(\`${sql}\`)`,
		notes: [
			'sqlCreateIndex is in firstly/sqlAdmin/server; it takes field keys: the columns above are db names, map them back if a field has a dbName.',
			...(helperFits
				? []
				: [
						'sqlCreateIndex cannot express it (raw definition, DESC, NULLS LAST, or a NULL order on a NOT NULL column): raw SQL.',
					]),
			'Big live table: build it CONCURRENTLY outside a transaction first, then the line above is a no-op.',
		],
	}
}
