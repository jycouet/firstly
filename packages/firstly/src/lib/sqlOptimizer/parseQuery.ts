import type { IndexCol } from './indexSpec'

export type FilterKind = 'eq' | 'in' | 'null' | 'range' | 'neq' | 'like'

export type ParsedQuery = {
	kind: 'select' | 'count' | 'other'
	/** tableKey of the main `from`. */
	table: string | null
	filters: { col: string; kind: FilterKind }[]
	/** As written by the query (PG defaults normalized away, like `IndexCol`). */
	orderBy: IndexCol[]
	hasLimit: boolean
	/** An `or` in the where: single-index plans get unlikely, read the plan. */
	hasOr: boolean
	/** A sub-select (sqlExpression, relation filter): parse covers the outer query only. */
	hasSubquery: boolean
}

const REGEX_WS = /\s+/g
const REGEX_SQL_COMMENT = /--.*?(?=\r\n|\n|$)/g
const REGEX_FROM = /\sfrom\s+((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)/i
const REGEX_COUNT = /^select\s+count\s*\(/i
const REGEX_WHERE_START = /\swhere\s/i
const REGEX_ORDER_START = /\sorder\s+by\s/i
const REGEX_LIMIT = /\slimit\s/i
const REGEX_WHERE_END = /\s(order\s+by|limit|offset|group\s+by)\s/i
const REGEX_ORDER_END = /\s(limit|offset)\s/i
const REGEX_OR = /\sor\s/i
const REGEX_SUBQUERY = /\(\s*select\s/i
const IDENT = String.raw`((?:"[^"]+"|[\w$]+)(?:\.(?:"[^"]+"|[\w$]+))?)`
const REGEX_CMP = new RegExp(String.raw`${IDENT}\s*(=|<>|!=|>=|<=|>|<)\s*`, 'g')
const REGEX_IN = new RegExp(String.raw`${IDENT}\s+in\s*\(`, 'gi')
const REGEX_IS_NULL = new RegExp(String.raw`${IDENT}\s+is\s+(not\s+)?null`, 'gi')
const REGEX_LIKE = new RegExp(String.raw`lower\s*\(\s*${IDENT}\s*\)\s*(?:not\s+)?like`, 'gi')
const REGEX_ORDER_COL = new RegExp(
	String.raw`^${IDENT}(?:\s+(asc|desc))?(?:\s+nulls\s+(first|last))?$`,
	'i',
)
const REGEX_PARAM_OR_LITERAL = /^(\$\d+|'|\d|true|false|null)/i
const REGEX_DIGITS = /^\d+$/

/** Last part of a possibly qualified identifier, unquoted. */
const colName = (ident: string) => ident.split('.').pop()!.replaceAll('"', '')

/** `name`, or `schema.name` outside public - same key as the sqlAdmin drift. */
export function tableKeyOf(ident: string) {
	const [name, schema] = ident.replaceAll('"', '').split('.').toReversed()
	return schema && schema !== 'public' ? `${schema}.${name}` : name!
}

export function normalizeSql(sql: string) {
	return sql.replace(REGEX_SQL_COMMENT, '').replace(REGEX_WS, ' ').trim()
}

function section(sql: string, start: RegExp, end: RegExp) {
	const s = start.exec(sql)
	if (!s) return ''
	const rest = sql.slice(s.index + s[0].length)
	const e = end.exec(` ${rest} `)
	return e ? rest.slice(0, Math.max(0, e.index - 1)) : rest
}

/**
 * Heuristic read of the SQL Remult emits (`select ... from "t" where ... Order By ... limit`).
 * Good enough to propose candidate indexes; the plan is the source of truth.
 */
export function parseQuery(rawSql: string): ParsedQuery {
	const sql = normalizeSql(rawSql)
	const first = sql.split(' ')[0]!.toLowerCase()
	const kind = first !== 'select' ? 'other' : REGEX_COUNT.test(sql) ? 'count' : 'select'
	const from = REGEX_FROM.exec(sql)
	const where = section(sql, REGEX_WHERE_START, REGEX_WHERE_END)
	const order = section(sql, REGEX_ORDER_START, REGEX_ORDER_END)

	const filters: ParsedQuery['filters'] = []
	const add = (ident: string, k: FilterKind) => {
		const col = colName(ident)
		if (REGEX_DIGITS.test(col)) return // `1 = 0` (empty $in)
		if (!filters.some((f) => f.col === col && f.kind === k)) filters.push({ col, kind: k })
	}
	for (const m of where.matchAll(REGEX_CMP)) {
		// `"a" = "b"` (join-ish) or `= lower(...)`: only column-vs-value is indexable here.
		const after = where.slice(m.index + m[0].length)
		if (!REGEX_PARAM_OR_LITERAL.test(after)) continue
		const op = m[2]!
		add(m[1]!, op === '=' ? 'eq' : op === '<>' || op === '!=' ? 'neq' : 'range')
	}
	for (const m of where.matchAll(REGEX_IN)) add(m[1]!, 'in')
	for (const m of where.matchAll(REGEX_IS_NULL)) add(m[1]!, m[2] ? 'neq' : 'null')
	for (const m of where.matchAll(REGEX_LIKE)) add(m[1]!, 'like')

	const orderBy: IndexCol[] = []
	for (const part of order ? order.split(',') : []) {
		const m = REGEX_ORDER_COL.exec(part.trim())
		if (!m) continue
		const desc = m[2]?.toLowerCase() === 'desc'
		const nulls = m[3]?.toLowerCase() as 'first' | 'last' | undefined
		const nullsFirst = nulls ? nulls === 'first' : desc
		const c: IndexCol = { col: colName(m[1]!) }
		if (desc) c.desc = true
		if (nullsFirst !== desc) c.nulls = nullsFirst ? 'first' : 'last'
		orderBy.push(c)
	}

	return {
		kind,
		table: from ? tableKeyOf(from[1]!) : null,
		filters,
		orderBy,
		hasLimit: REGEX_LIMIT.test(sql),
		hasOr: REGEX_OR.test(` ${where} `),
		hasSubquery: REGEX_SUBQUERY.test(sql),
	}
}
