import { describe, expect, it } from 'vitest'

import { groupQueries, positionalArgs } from './capture'
import { indexDdl } from './ddl'
import { coversCols, parseIndexSpec, sqlIndexCols } from './indexSpec'
import { parseQuery } from './parseQuery'
import { summarizePlan } from './plan'
import { suggestIndexes } from './suggest'

const REMULT_SQL = `select "id", "status", "doneAt"
 from "tasks" where "status" = $1 and "ownerId" in ($2,$3) and "doneAt" > $4 Order By "doneAt" nulls first, "id" limit 20 offset 0`

describe('parseIndexSpec', () => {
	it('parses direction / nulls and drops PG defaults', () => {
		expect(parseIndexSpec('a, b desc, c nulls first, d desc nulls first', 't')).toEqual({
			table: 't',
			cols: [
				{ col: 'a' },
				{ col: 'b', desc: true },
				{ col: 'c', nulls: 'first' },
				{ col: 'd', desc: true },
			],
		})
	})
	it('takes a table prefix', () => {
		expect(parseIndexSpec('ff.users: email', 't').table).toBe('ff.users')
	})
	it('writes SQL columns', () => {
		expect(sqlIndexCols(parseIndexSpec('a, b desc nulls last', 't').cols)).toBe(
			'"a", "b" DESC NULLS LAST',
		)
	})
})

describe('coversCols', () => {
	const c = (s: string) => parseIndexSpec(s, 't').cols
	it('leftmost prefix, same order', () => {
		expect(coversCols(c('a'), c('a, b'))).toBe(true)
		expect(coversCols(c('b'), c('a, b'))).toBe(false)
	})
	it('backward scan: all flipped is fine, NULL order mismatch is not', () => {
		expect(coversCols(c('a desc nulls last'), c('a nulls first'))).toBe(true)
		expect(coversCols(c('a nulls first'), c('a'))).toBe(false)
	})
	it('ignores direction of equality columns', () => {
		expect(coversCols(c('a, b nulls first'), c('a desc, b nulls first'), 1)).toBe(true)
	})
})

describe('parseQuery', () => {
	it('reads the Remult shape', () => {
		expect(parseQuery(REMULT_SQL)).toEqual({
			kind: 'select',
			table: 'tasks',
			filters: [
				{ col: 'status', kind: 'eq' },
				{ col: 'doneAt', kind: 'range' },
				{ col: 'ownerId', kind: 'in' },
			],
			orderBy: [{ col: 'doneAt', nulls: 'first' }, { col: 'id' }],
			hasLimit: true,
			hasOr: false,
			hasSubquery: false,
		})
	})
	it('count, schema table, is null, like, empty $in', () => {
		const q = parseQuery(
			`select count(*) as count from "ff"."logs" where "a" is null and lower ("b") like lower ($1) escape '\\' and 1 = 0 /*isIn with no values*/`,
		)
		expect(q.kind).toBe('count')
		expect(q.table).toBe('ff.logs')
		expect(q.filters).toEqual([
			{ col: 'a', kind: 'null' },
			{ col: 'b', kind: 'like' },
		])
	})
	it('desc sorts: Remult writes nulls last, which is the asc-nulls-first index backwards', () => {
		expect(parseQuery(`select "a" from "t" Order By "a" desc nulls last`).orderBy).toEqual([
			{ col: 'a', desc: true, nulls: 'last' },
		])
	})
})

describe('suggestIndexes', () => {
	const q = parseQuery(REMULT_SQL)
	it('eq + sort first, with and without NULL order, then range / singles', () => {
		const cols = suggestIndexes(q).map((c) => c.cols)
		expect(cols).toEqual([
			'status, ownerId, doneAt nulls first, id',
			'status, ownerId, doneAt, id',
			'status, ownerId, doneAt',
			'status, ownerId',
			'status',
			'ownerId',
			'doneAt',
		])
	})
	it('keeps NULLS FIRST on every sort column: PG matches it even on NOT NULL ones', () => {
		const d = parseQuery(`select "id" from "t" Order By "id" nulls first limit 20 offset 0`)
		expect(suggestIndexes(d)[0]!.cols).toBe('id nulls first')
	})
	it('marks candidates an existing index covers', () => {
		const existing = [{ name: 'ix', cols: parseIndexSpec('status', 't').cols }]
		const c = suggestIndexes(q, { existing }).find((x) => x.cols === 'status')
		expect(c?.coveredBy).toBe('ix')
	})
	it('canonical direction: a desc sort suggests the asc index', () => {
		const d = parseQuery(`select "a" from "t" Order By "a" desc nulls last limit 5 offset 0`)
		expect(suggestIndexes(d)[0]!.cols).toBe('a nulls first')
	})
})

describe('capture grouping', () => {
	it('groups by normalized sql, keeps the slowest args', () => {
		const g = groupQueries([
			{ sql: 'select 1 from "t" where "a" = $1', args: { $1: 'x' }, ms: 1, at: '' },
			{ sql: 'select 1\n from "t"  where "a" = $1', args: { $1: 'y' }, ms: 5, at: '' },
		])
		expect(g).toHaveLength(1)
		expect(g[0]).toMatchObject({ calls: 2, totalMs: 6, maxMs: 5, args: { $1: 'y' }, table: 't' })
	})
	it('positional args sort numerically', () => {
		expect(positionalArgs({ $10: 'j', $2: 'b', $1: 'a' })).toEqual(['a', 'b', 'j'])
	})
})

describe('summarizePlan', () => {
	it('flags seq scans, sorts, filtered rows', () => {
		const s = summarizePlan({
			'Planning Time': 0.1,
			'Execution Time': 2,
			Plan: {
				'Node Type': 'Limit',
				'Plan Rows': 20,
				'Actual Rows': 20,
				'Shared Hit Blocks': 10,
				Plans: [
					{
						'Node Type': 'Sort',
						'Sort Key': ['"doneAt" NULLS FIRST'],
						'Sort Method': 'top-N heapsort',
						Plans: [
							{
								'Node Type': 'Seq Scan',
								'Relation Name': 'tasks',
								'Rows Removed by Filter': 900,
								'Actual Loops': 1,
							},
						],
					},
				],
			},
		})
		expect(s.seqScans).toEqual(['tasks'])
		expect(s.sorts).toEqual([{ key: ['"doneAt" NULLS FIRST'], method: 'top-N heapsort' }])
		expect(s.rowsRemovedByFilter).toBe(900)
		expect(s.tree[2]).toContain('    Seq Scan on tasks')
	})
})

describe('indexDdl', () => {
	it('helper line when sqlCreateIndex can express it', () => {
		const d = indexDdl(parseIndexSpec('status, doneAt nulls first', 'tasks'))
		expect(d.sql).toBe(
			'CREATE INDEX IF NOT EXISTS "FF_IX_tasks_status_doneAt_NF" ON "tasks" ("status", "doneAt" NULLS FIRST);',
		)
		expect(d.initApi).toBe(
			`await SqlDatabase.getDb().execute(await sqlCreateIndex(<EntityOf_tasks>, ['status', 'doneAt'], { ifNotExists: true }))`,
		)
	})
	it('raw SQL when NULLS FIRST sits on a NOT NULL column (the helper would drop it)', () => {
		const spec = parseIndexSpec('doneAt nulls first, id nulls first', 'tasks')
		expect(indexDdl(spec, { doneAt: true, id: false }).initApi).toContain('CREATE INDEX')
		expect(indexDdl(spec, { doneAt: true, id: true }).initApi).toContain('sqlCreateIndex')
	})
	it('raw SQL for a DESC mix', () => {
		expect(indexDdl(parseIndexSpec('a, b desc', 't')).initApi).toContain('CREATE INDEX')
	})
})
