import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { SqlDatabase } from 'remult'

import {
	everyRequestQueries,
	groupQueries,
	groupRoutes,
	idless,
	positionalArgs,
	readCapture,
	withSqlCapture,
	type CapturedQuery,
} from './capture'
import { indexDdl } from './ddl'
import {
	coversCols,
	parseIndexSpec,
	parseIndexSpecs,
	sqlIndexBody,
	sqlIndexCols,
} from './indexSpec'
import { groupKeySql, parseQuery } from './parseQuery'
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
	it('unique, raw (gin / partial), several at once', () => {
		expect(parseIndexSpec('unique token', 't')).toEqual({
			table: 't',
			cols: [{ col: 'token' }],
			unique: true,
		})
		const gin = parseIndexSpec('users: using gin (("referentIds"::jsonb))', 't')
		expect(gin).toEqual({ table: 'users', cols: [], raw: 'using gin (("referentIds"::jsonb))' })
		expect(sqlIndexBody(parseIndexSpec('(a) where "b" is null', 't'))).toBe('(a) where "b" is null')
		expect(parseIndexSpecs('a, b + o: c', 't').map((x) => x.table)).toEqual(['t', 'o'])
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
	it('table is the depth-0 from: not inside extract(), not a CTE', () => {
		expect(parseQuery('select extract(year from "enregistrementDate") from "q"').table).toBe('q')
		expect(parseQuery('with x as (select 1 from "a") select * from x').table).toBe(null)
	})
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
	it('reads the outer query only: sqlExpression sub-selects are masked', () => {
		const q = parseQuery(
			`select "id", ((SELECT json_agg(r.id ORDER BY r.name) FROM "users" r WHERE r."referentIds"::jsonb ? "users"."id")) as x from "users" where "ok" = $1 Order By "name", "id" limit 20 offset 0`,
		)
		expect(q).toMatchObject({
			table: 'users',
			filters: [{ col: 'ok', kind: 'eq' }],
			orderBy: [{ col: 'name' }, { col: 'id' }],
			hasSubquery: true,
		})
	})
	it('skips keywords and positions: CASE ... END = $1, x IS NOT NULL = $1, Order By 1', () => {
		const q = parseQuery(
			`select "a" from "t" where (case when "a" > 0 then 1 end) = $1 and "b" is not null = $2 and "c"::text like $3 Order By 1, "a"`,
		)
		expect(q.filters.map((f) => f.col)).not.toContain('end')
		expect(q.filters).toContainEqual({ col: 'c', kind: 'like' })
		expect(q.orderBy).toEqual([{ col: 'a' }])
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
	it('drops columns the table lacks, stops at a unique equality', () => {
		const cols = (o: Parameters<typeof suggestIndexes>[1]) => suggestIndexes(q, o).map((c) => c.cols)
		expect(cols({ columns: ['status', 'doneAt', 'id'] })[0]).toBe('status, doneAt nulls first, id')
		expect(cols({ unique: ['status'] })).toEqual(['status'])
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
	it('one group whatever the $in length, replaying the slowest sql', () => {
		const g = groupQueries([
			{ sql: 'select 1 from "t" where "a" in ($1,$2)', args: { $1: 1, $2: 2 }, ms: 1, at: '' },
			{
				sql: 'select 1 from "t" where "a" in ($1,$2,$3)',
				args: { $1: 1, $2: 2, $3: 3 },
				ms: 4,
				at: '',
			},
		])
		expect(g).toHaveLength(1)
		expect(g[0]!.sql).toContain('$3')
		expect(groupKeySql('x in ($1, $2)')).toBe('x in ($…)')
	})
	it('routes, requests and the most repeated query per request', () => {
		const q = (sql: string, route: string, req: number): CapturedQuery => ({
			sql,
			args: {},
			ms: 2,
			at: '',
			route,
			req,
		})
		const one = 'select 1 from "t" where "id" = $1'
		const entries = [
			q(one, 'GET /list', 1),
			q(one, 'GET /list', 1),
			q(one, 'GET /list', 1),
			q('select 2 from "u"', 'GET /list', 1),
			q(one, 'GET /list', 2),
			q(one, 'GET /item/[id]', 3),
		]
		const [g] = groupQueries(entries).filter((x) => x.table === 't')
		expect(g).toMatchObject({
			calls: 5,
			maxPerRequest: 3,
			routes: { 'GET /list': 4, 'GET /item/[id]': 1 },
		})
		const list = groupRoutes(entries).find((r) => r.route === 'GET /list')!
		expect(list).toMatchObject({ requests: 2, queries: 5, totalMs: 10, queriesPerRequest: 2.5 })
		expect(list.mostRepeated).toEqual({ id: g!.id, perRequest: 3 })
	})
	it('withSqlCapture numbers requests from the context, seconds to ms', () => {
		const dir = mkdtempSync(join(tmpdir(), 'ffopt-'))
		const file = join(dir, 'c.jsonl')
		const threshold = SqlDatabase.durationThreshold
		try {
			const a = {}
			const b = {}
			let cur: object = a
			const log = withSqlCapture(undefined, {
				file,
				context: () => ({ route: cur === a ? 'GET /a' : 'GET /b', key: cur }),
			}) as (d: number, q: string, args: object) => void
			log(0.002, 'select 1 from "t"', {})
			cur = b
			log(0.001, 'select 1 from "t"', {})
			cur = a
			log(0.001, 'update "t" set "a" = 1', {})
			log(0.001, 'select 2 from "t"', {})
			expect(readCapture(file).map(({ ms, route, req }) => ({ ms, route, req }))).toEqual([
				{ ms: 2, route: 'GET /a', req: 1 },
				{ ms: 1, route: 'GET /b', req: 2 },
				{ ms: 1, route: 'GET /a', req: 1 },
			])
		} finally {
			SqlDatabase.durationThreshold = threshold
			rmSync(dir, { recursive: true, force: true })
		}
	})
	it('routes by page, queries every request runs', () => {
		const e = (sql: string, req: number, page?: string): CapturedQuery => ({
			sql,
			args: {},
			ms: 1,
			at: '',
			route: 'GET /api/x',
			req,
			...(page ? { page } : {}),
		})
		const auth = 'select 1 from "session" where "token" = $1'
		const entries = [e(auth, 1, '/a'), e('select 2 from "x"', 1, '/a'), e(auth, 2, '/b'), e(auth, 3)]
		expect(groupRoutes(entries, 'page').map((r) => [r.route, r.requests])).toEqual([
			['/a', 1],
			['/b', 1],
			['(no page)', 1],
		])
		expect(everyRequestQueries(entries)).toMatchObject([{ ofRequests: 1, calls: 3 }])
	})
	it('id segments collapse, entity keys stay', () => {
		expect(idless('/api/users/123')).toBe('/api/users/[id]')
		expect(idless('/u/3f2b8a1e-0c4d-4e5f-8a9b-1c2d3e4f5a6b/x')).toBe('/u/[id]/x')
		expect(idless('/u/clx8a9b0c0000abcd1234efgh')).toBe('/u/[id]')
		expect(idless('/api/site-loc1-buildings')).toBe('/api/site-loc1-buildings')
		expect(idless('/a/3lbxk2xyz7a2c')).toBe('/a/[id]')
		expect(idless('/a/journalentries')).toBe('/a/journalentries')
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
			`await SqlDatabase.getDb().execute(await sqlCreateIndex(<EntityOf_tasks>, ['status', 'doneAt'], { ifNotExists: true, nullsFirst: true }))`,
		)
	})
	it('raw SQL when NULLS FIRST sits on a NOT NULL column (the helper would drop it)', () => {
		const spec = parseIndexSpec('doneAt nulls first, id nulls first', 'tasks')
		expect(indexDdl(spec, { doneAt: true, id: false }).initApi).toContain('CREATE INDEX')
		expect(indexDdl(spec, { doneAt: true, id: true }).initApi).toContain('sqlCreateIndex')
	})
	it('explicit nullsFirst: false on a nullable column, so the helper builds the tested index', () => {
		const d = indexDdl(parseIndexSpec('status, doneAt', 'tasks'), { status: false, doneAt: true })
		expect(d.name).toBe('FF_IX_tasks_status_doneAt')
		expect(d.initApi).toContain('{ ifNotExists: true, nullsFirst: false }')
		expect(indexDdl(parseIndexSpec('status', 'tasks'), { status: false }).initApi).toContain(
			'{ ifNotExists: true }',
		)
	})
	it('unique and raw', () => {
		const u = indexDdl(parseIndexSpec('unique token', 'sessions'), { token: false })
		expect(u.name).toBe('FF_UX_sessions_token')
		expect(u.initApi).toContain('unique: true')
		const g = indexDdl(parseIndexSpec('using gin (("referentIds"::jsonb))', 'users'))
		expect(g.sql).toBe(
			'CREATE INDEX IF NOT EXISTS "FF_IX_users_using_gin_referentIds_jsonb" ON "users" using gin (("referentIds"::jsonb));',
		)
		expect(g.initApi).toContain('execute(`CREATE INDEX')
	})
	it('raw SQL for a DESC mix', () => {
		expect(indexDdl(parseIndexSpec('a, b desc', 't')).initApi).toContain('CREATE INDEX')
	})
})
