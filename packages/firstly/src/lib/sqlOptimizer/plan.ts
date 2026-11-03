/** A node of `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. */
export type PlanNode = {
	'Node Type': string
	'Relation Name'?: string
	'Index Name'?: string
	'Plan Rows'?: number
	'Actual Rows'?: number
	'Actual Loops'?: number
	'Sort Key'?: string[]
	'Sort Method'?: string
	'Shared Hit Blocks'?: number
	'Shared Read Blocks'?: number
	'Rows Removed by Filter'?: number
	Filter?: string
	'Index Cond'?: string
	Plans?: PlanNode[]
}

export type ExplainJson = { Plan: PlanNode; 'Planning Time': number; 'Execution Time': number }

export type PlanSummary = {
	/** Indented one-liners, root first: what the agent reads to compare plans. */
	tree: string[]
	seqScans: string[]
	indexes: string[]
	sorts: { key: string[]; method?: string }[]
	/** 8kB pages: hit = cache, read = disk. Root totals. */
	buffers: { hit: number; read: number }
	rows: { estimated: number; actual: number }
	/** Rows read then thrown away by a Filter: a missing index column shows up here. */
	rowsRemovedByFilter: number
}

const SCAN_TYPES = new Set(['Seq Scan', 'Parallel Seq Scan'])

export function summarizePlan(e: ExplainJson): PlanSummary {
	const s: PlanSummary = {
		tree: [],
		seqScans: [],
		indexes: [],
		sorts: [],
		buffers: { hit: e.Plan['Shared Hit Blocks'] ?? 0, read: e.Plan['Shared Read Blocks'] ?? 0 },
		rows: { estimated: e.Plan['Plan Rows'] ?? 0, actual: e.Plan['Actual Rows'] ?? 0 },
		rowsRemovedByFilter: 0,
	}
	const walk = (n: PlanNode, depth: number) => {
		const loops = n['Actual Loops'] ?? 1
		const on = n['Relation Name'] ? ` on ${n['Relation Name']}` : ''
		const using = n['Index Name'] ? ` using ${n['Index Name']}` : ''
		const extra = [
			n['Index Cond'] ? `cond ${n['Index Cond']}` : '',
			n.Filter ? `filter ${n.Filter}` : '',
			n['Sort Key'] ? `key ${n['Sort Key'].join(', ')}` : '',
			n['Rows Removed by Filter'] ? `removed ${n['Rows Removed by Filter']}` : '',
		]
			.filter(Boolean)
			.join('; ')
		s.tree.push(
			`${'  '.repeat(depth)}${n['Node Type']}${using}${on} (rows ${n['Actual Rows'] ?? '?'}/${n['Plan Rows'] ?? '?'}${loops > 1 ? ` x${loops}` : ''})${extra ? ` [${extra}]` : ''}`,
		)
		if (SCAN_TYPES.has(n['Node Type']) && n['Relation Name']) s.seqScans.push(n['Relation Name'])
		if (n['Index Name']) s.indexes.push(n['Index Name'])
		if (n['Node Type'].endsWith('Sort') && n['Sort Key']) {
			s.sorts.push({ key: n['Sort Key'], method: n['Sort Method'] })
		}
		s.rowsRemovedByFilter += (n['Rows Removed by Filter'] ?? 0) * loops
		for (const c of n.Plans ?? []) walk(c, depth + 1)
	}
	walk(e.Plan, 0)
	return s
}

export const median = (xs: number[]) => {
	const s = xs.toSorted((a, b) => a - b)
	const m = Math.floor(s.length / 2)
	return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}
