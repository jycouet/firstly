import { describe, expect, it } from 'vitest'

import type { SqlDatabase } from 'remult'

import { enrichSqlError } from './sqlError'

const catalog = {
	execute: async (sql: string) => ({
		rows: sql.includes('information_schema.columns')
			? [
					{ table_name: 'activities', column_name: 'analysisVersion' },
					{ table_name: 'activities', column_name: 'startedAt' },
					{ table_name: 'workouts', column_name: 'startedAt' },
					{ table_name: 'athleteEraEstimates', column_name: 'estMaxBpm' },
				]
			: [{ table_name: 'keyValues' }, { table_name: 'activities' }],
	}),
} as unknown as SqlDatabase

const pgError = (message: string, code: string, extra: object = {}) =>
	Object.assign(new Error(message), { code, ...extra })

const enrich = async (err: unknown, cmd = '') =>
	((await enrichSqlError(catalog, err, cmd)) as Error).message

describe('enrichSqlError', () => {
	it('leaves alone anything that is not a database error', async () => {
		const err = new Error('boom')
		expect(await enrichSqlError(catalog, err)).toBe(err)
		expect(await enrichSqlError(catalog, 'not an error')).toBe('not an error')
	})

	it('leaves alone a node error that happens to carry a code', async () => {
		const err = pgError('connect ECONNREFUSED', 'ECONNREFUSED')
		expect(await enrichSqlError(catalog, err)).toBe(err)
	})

	it('leaves alone a lost connection instead of asking it for a catalog', async () => {
		const err = pgError('terminating connection', '08006')
		expect(await enrichSqlError(catalog, err)).toBe(err)
	})

	it('keeps the detail line, where constraint violations say what happened', async () => {
		const msg = await enrich(
			pgError('insert violates foreign key constraint', '23503', {
				detail: 'Key (did)=(x) is not present in table "users".',
			}),
		)
		expect(msg).toBe(
			'insert violates foreign key constraint · Key (did)=(x) is not present in table "users". · [23503]',
		)
	})

	it("keeps Postgres' own hint instead of guessing", async () => {
		const msg = await enrich(
			pgError('column "estMaxHrBpm" does not exist', '42703', {
				hint: 'Perhaps you meant to reference the column "athleteEraEstimates.estMaxBpm".',
				position: '8',
			}),
		)
		expect(msg).toBe(
			'column "estMaxHrBpm" does not exist · Perhaps you meant to reference the column "athleteEraEstimates.estMaxBpm". · [42703 at 8]',
		)
	})

	it('matches a lowercased column back to its camelCase spelling', async () => {
		expect(await enrich(pgError('column a.analysisversion does not exist', '42703'))).toContain(
			'Did you mean "activities"."analysisVersion"?',
		)
	})

	it('prefers a column from a table the query actually mentions', async () => {
		const msg = await enrich(
			pgError('column "started" does not exist', '42703'),
			'select "started" from "activities"',
		)
		expect(msg).toContain('Did you mean "activities"."startedAt"?')
		expect(msg).not.toContain('workouts')
	})

	it('ignores an identifier too short to mean anything', async () => {
		expect(await enrich(pgError('column "st" does not exist', '42703'))).toBe(
			'column "st" does not exist · [42703]',
		)
	})

	it('matches a snake_case guess to the real table', async () => {
		expect(await enrich(pgError('relation "key_value" does not exist', '42P01'))).toContain(
			'Did you mean "keyValues"?',
		)
	})

	it('suggests nothing when nothing is close', async () => {
		const msg = await enrich(pgError('relation "zzzzzzzz" does not exist', '42P01'))
		expect(msg).toBe('relation "zzzzzzzz" does not exist · [42P01]')
	})

	it('still adds the code when the catalog is unreachable', async () => {
		const broken = {
			execute: async () => {
				throw new Error('connection terminated')
			},
		} as unknown as SqlDatabase
		const msg = (
			(await enrichSqlError(broken, pgError('relation "x" does not exist', '42P01'))) as Error
		).message
		expect(msg).toBe('relation "x" does not exist · [42P01]')
	})
})
