import {
	coversCols,
	formatIndexCols,
	isNullsFirst,
	normalizeNulls,
	type IndexCol,
	type IndexSpec,
} from './indexSpec'
import type { ParsedQuery } from './parseQuery'

export type ExistingIndex = { name: string; cols: IndexCol[] }

export type Candidate = {
	spec: IndexSpec
	/** `formatIndexCols`, the `--variant` / `--index` syntax. */
	cols: string
	why: string
	/** An existing index already serves it: testing it again is pointless. */
	coveredBy?: string
}

const flip = (c: IndexCol) =>
	normalizeNulls({ col: c.col, desc: !c.desc, nulls: isNullsFirst(c) ? 'last' : 'first' })

const stripNulls = (c: IndexCol): IndexCol => (c.desc ? { col: c.col, desc: true } : { col: c.col })

/**
 * Starting points, not answers: the usual btree shapes for a parsed query (equality columns
 * first, then the sort, then a range). The sort is kept exactly as written, NULL placement
 * included: PG matches it even on NOT NULL columns. Compare them, the plan decides.
 */
export function suggestIndexes(
	q: ParsedQuery,
	o: { existing?: ExistingIndex[] } = {},
): Candidate[] {
	if (!q.table) return []
	const table = q.table
	const eq = q.filters.filter((f) => f.kind === 'eq' || f.kind === 'in' || f.kind === 'null')
	const range = q.filters.filter((f) => f.kind === 'range')
	const eqCols = [...new Set(eq.map((f) => f.col))]

	// A sort on an equality-filtered column is constant.
	let order = q.orderBy.filter((c) => !eqCols.includes(c.col))
	// Canonical direction: the first sort column ascending (PG scans backwards for free).
	if (order[0]?.desc) order = order.map(flip)

	const out: Candidate[] = []
	const push = (cols: IndexCol[], why: string, orderFrom: number) => {
		if (cols.length === 0) return
		const key = formatIndexCols(cols)
		if (out.some((c) => c.cols === key)) return
		const cover = o.existing?.find((e) => coversCols(cols, e.cols, orderFrom))
		out.push({
			spec: { table, cols },
			cols: key,
			why,
			...(cover ? { coveredBy: cover.name } : {}),
		})
	}
	const eqIx: IndexCol[] = eqCols.map((col) => ({ col }))

	if (order.length > 0 && (eqIx.length > 0 || q.hasLimit)) {
		push(
			[...eqIx, ...order],
			eqIx.length > 0
				? 'equality filters, then the sort: rows come out sorted (no Sort node), stops at LIMIT'
				: 'the sort alone: reads the first rows in order and stops at LIMIT',
			eqIx.length,
		)
		if (order.some((c) => c.nulls)) {
			push(
				[...eqIx, ...order.map(stripNulls)],
				'same, default NULL placement: shows whether NULLS order decides index use',
				eqIx.length,
			)
		}
	}
	if (range.length > 0) {
		push([...eqIx, { col: range[0]!.col }], 'equality filters, then the range', eqIx.length + 1)
	}
	if (eqIx.length > 1 || (eqIx.length === 1 && order.length === 0)) {
		push(eqIx, 'equality filters only', eqIx.length)
	}
	for (const col of [...eqCols, ...range.map((f) => f.col)]) {
		push([{ col }], 'single column: the most selective filter alone', 1)
	}
	return out
}
