import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Entity, Fields, Remult, SqlDatabase } from 'remult'
import { NullSort } from 'remult/internals'
import { createPostgresDataProvider } from 'remult/postgres'
import { startTestServer, type TestServer } from '@kitql/postgres/test'

import { groupQueries, positionalArgs, readCapture, withSqlCapture } from './capture'
import { parseIndexSpec } from './indexSpec'
import { parseQuery } from './parseQuery'
import { auditIndexes, existingIndexes, explainWith, tableSchema } from './pg'
import { suggestIndexes } from './suggest'

@Entity('tasks')
class Task {
	@Fields.integer() id = 0
	@Fields.string() status = ''
	@Fields.date({ allowNull: true }) doneAt: Date | null = null
}

// Real Postgres: a binary download on the first run, then ~1s.
describe('sqlOptimizer on Postgres', { timeout: 120_000 }, () => {
	let server: TestServer
	let db: pg.Client
	let dir: string
	const prevLog = SqlDatabase.LogToConsole

	beforeAll(async () => {
		server = await startTestServer()
		db = new pg.Client({ connectionString: server.url() })
		await db.connect()
		await db.query(`
			CREATE TABLE tasks (id int PRIMARY KEY, status text NOT NULL, "doneAt" timestamptz NULL);
			INSERT INTO tasks
				SELECT i, (ARRAY['open','done','late'])[1 + i % 3],
					CASE WHEN i % 4 = 0 THEN NULL ELSE now() - (i || ' minutes')::interval END
				FROM generate_series(1, 60000) i;
			ANALYZE tasks;`)
		dir = mkdtempSync(join(tmpdir(), 'sqlopt-'))
	}, 120_000)

	afterAll(async () => {
		SqlDatabase.LogToConsole = prevLog
		NullSort.order = 'native'
		await db?.end()
		server?.stop()
		if (dir) rmSync(dir, { recursive: true, force: true })
	})

	it('capture -> suggest -> explain: NULLS FIRST index removes the sort', async () => {
		const file = join(dir, 'capture.jsonl')
		SqlDatabase.LogToConsole = withSqlCapture(undefined, file)
		NullSort.order = { asc: 'NULLS FIRST', desc: 'NULLS LAST' }
		const dp = await createPostgresDataProvider({ connectionString: server.url() })
		const remult = new Remult(dp)
		await remult.repo(Task).find({ where: { status: 'open' }, orderBy: { doneAt: 'asc' }, limit: 20 })
		await (dp as SqlDatabase & { end?: () => Promise<void> }).end?.()

		const [q] = groupQueries(readCapture(file)).filter((g) => g.table === 'tasks')
		expect(q).toBeDefined()
		const parsed = parseQuery(q!.sql)
		expect(parsed.filters).toEqual([{ col: 'status', kind: 'eq' }])
		expect(parsed.orderBy[0]).toEqual({ col: 'doneAt', nulls: 'first' })

		const schema = await tableSchema(db, 'tasks')
		const cands = suggestIndexes(parsed, { existing: schema.indexes })
		// NULL order only on allowNull columns: the NOT NULL id keeps the default.
		expect(cands[0]!.cols).toBe('status, doneAt nulls first, id')

		const query = { sql: q!.sql, params: positionalArgs(q!.args) }
		const base = await explainWith(db, query, { runs: 1 })
		const nf = await explainWith(db, query, { create: [cands[0]!.spec], runs: 1 })
		const plain = await explainWith(db, query, {
			create: [parseIndexSpec('status, doneAt, id', 'tasks')],
			runs: 1,
		})

		expect(base.plan.sorts.length).toBeGreaterThan(0)
		expect(nf.plan.indexes).toContain('ffopt_1')
		expect(nf.plan.sorts).toEqual([])
		// Default NULLS LAST can't feed a NULLS FIRST sort: it still sorts.
		expect(plain.plan.sorts.length).toBeGreaterThan(0)

		// Rolled back: only the PK is left.
		expect((await existingIndexes(db, 'tasks')).map((i) => i.name)).toEqual(['tasks_pkey'])
	})

	it('reads index options and audits', async () => {
		await db.query(
			`CREATE INDEX ix_a ON tasks (status, "doneAt" NULLS FIRST); CREATE INDEX ix_b ON tasks (status)`,
		)
		const ixs = await existingIndexes(db, 'tasks')
		expect(ixs.find((i) => i.name === 'ix_a')!.cols).toEqual([
			{ col: 'status' },
			{ col: 'doneAt', nulls: 'first' },
		])
		const audit = await auditIndexes(db)
		expect(audit.redundant).toContainEqual({ table: 'tasks', index: 'ix_b', coveredBy: 'ix_a' })
		await db.query(`DROP INDEX ix_a; DROP INDEX ix_b`)
	})
})
