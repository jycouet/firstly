/** One index column. `nulls` omitted = PG default (LAST for asc, FIRST for desc). */
export type IndexCol = { col: string; desc?: boolean; nulls?: 'first' | 'last' }

/**
 * A candidate index: `table` is a tableKey (`name`, or `schema.name` outside public). `raw` is a
 * definition btree columns can't say (`using gin (...)`, `(expr)`, `... where ...`, `include`):
 * `cols` is then empty.
 */
export type IndexSpec = { table: string; cols: IndexCol[]; unique?: boolean; raw?: string }

const REGEX_COL = /^"?([^"\s]+)"?(?:\s+(asc|desc))?(?:\s+nulls\s+(first|last))?$/i
const REGEX_TABLE_PREFIX = /^\s*([^\s:("]+)\s*:(?!:)\s*(.*)$/
const REGEX_UNIQUE = /^unique\s+/i
const REGEX_RAW = /^(using\s|\()|\s(where|include)\s/i
const REGEX_PLUS = /\s\+\s/

/**
 * `"a, b desc nulls first"`; `"table: a, b"` targets another table than `defaultTable`;
 * `"unique a"`; raw: `"using gin (("x"::jsonb))"`, `"(a, b) where "c" is null"`.
 */
export function parseIndexSpec(spec: string, defaultTable: string): IndexSpec {
	const m = REGEX_TABLE_PREFIX.exec(spec)
	const table = m ? m[1]! : defaultTable
	let body = (m ? m[2]! : spec).trim()
	const unique = REGEX_UNIQUE.test(body)
	if (unique) body = body.replace(REGEX_UNIQUE, '')
	const u = unique ? { unique } : {}
	if (REGEX_RAW.test(body)) return { table, cols: [], raw: body, ...u }
	const cols = body
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => {
			const c = REGEX_COL.exec(s)
			if (!c) throw new Error(`Bad index column "${s}" (want: col [asc|desc] [nulls first|last])`)
			const col: IndexCol = { col: c[1]! }
			if (c[2]?.toLowerCase() === 'desc') col.desc = true
			if (c[3]) col.nulls = c[3].toLowerCase() as 'first' | 'last'
			return normalizeNulls(col)
		})
	if (cols.length === 0) throw new Error(`Empty index spec "${spec}"`)
	return { table, cols, ...u }
}

/** Several indexes tested together: `"a, b + other: c"`. */
export const parseIndexSpecs = (spec: string, defaultTable: string) =>
	spec.split(REGEX_PLUS).map((s) => parseIndexSpec(s, defaultTable))

/** Back to `--variant` syntax; table prefix only when it is not `defaultTable`. */
export function formatIndexSpec(spec: IndexSpec, defaultTable?: string) {
	const prefix = spec.table === defaultTable ? '' : `${spec.table}: `
	return `${prefix}${spec.unique ? 'unique ' : ''}${spec.raw ?? formatIndexCols(spec.cols)}`
}

/** What follows `ON <table>` in `CREATE INDEX`. */
export const sqlIndexBody = (spec: IndexSpec) => spec.raw ?? `(${sqlIndexCols(spec.cols)})`

/** Drop a `nulls` that is the PG default, so equal indexes compare equal. */
export function normalizeNulls(c: IndexCol): IndexCol {
	const nullsFirst = c.nulls ? c.nulls === 'first' : !!c.desc
	const out: IndexCol = { col: c.col }
	if (c.desc) out.desc = true
	if (nullsFirst !== !!c.desc) out.nulls = nullsFirst ? 'first' : 'last'
	return out
}

export const isNullsFirst = (c: IndexCol) => (c.nulls ? c.nulls === 'first' : !!c.desc)

export function formatIndexCols(cols: IndexCol[]) {
	return cols
		.map((c) => `${c.col}${c.desc ? ' desc' : ''}${c.nulls ? ` nulls ${c.nulls}` : ''}`)
		.join(', ')
}

/** `"a" DESC NULLS FIRST`-style column list, for `CREATE INDEX ... (<here>)`. */
export function sqlIndexCols(cols: IndexCol[]) {
	return cols
		.map(
			(c) => `"${c.col}"${c.desc ? ' DESC' : ''}${c.nulls ? ` NULLS ${c.nulls.toUpperCase()}` : ''}`,
		)
		.join(', ')
}

/**
 * Can an index with `have` columns serve the `want` ordering? Same leftmost columns, and
 * per column the same (desc, nulls) - or all flipped, since PG scans a btree backwards.
 * Columns before `orderFrom` are equality filters: their direction doesn't matter.
 */
export function coversCols(want: IndexCol[], have: IndexCol[], orderFrom = 0) {
	if (want.length === 0 || have.length < want.length) return false
	if (!want.every((c, i) => have[i]!.col === c.col)) return false
	const sorted = want.map((c, i) => [c, have[i]!] as const).slice(orderFrom)
	const same = sorted.every(([a, b]) => !!a.desc === !!b.desc && isNullsFirst(a) === isNullsFirst(b))
	const flipped = sorted.every(
		([a, b]) => !!a.desc !== !!b.desc && isNullsFirst(a) !== isNullsFirst(b),
	)
	return same || flipped
}
