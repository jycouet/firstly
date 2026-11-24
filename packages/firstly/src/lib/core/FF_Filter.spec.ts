import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'

import {
	Entity,
	Fields,
	InMemoryDataProvider,
	remult,
	Remult,
	SqlDatabase,
	type DataProvider,
} from 'remult'
import { NodeSqliteDataProvider } from 'remult/remult-node-sqlite'
import { TestApiDataProvider } from 'remult/server'

import { FF_Filter } from './FF_Filter'

@Entity<OwnedTask>('owned_tasks', {
	allowApiCrud: true,
	apiPrefilter: () => FF_Filter.owner<OwnedTask>('userId'),
})
class OwnedTask {
	@Fields.integer()
	id = 0
	@Fields.string({ allowNull: true })
	userId: string | null = null
}

@Entity<OwnedOrTask>('owned_or_tasks', {
	allowApiCrud: true,
	apiPrefilter: () => FF_Filter.ownerOr<OwnedOrTask>({ roles: ['admin'] }),
})
class OwnedOrTask {
	@Fields.integer()
	id = 0
	@Fields.string({ allowNull: true })
	userId: string | null = null
}

const providers: [string, () => DataProvider][] = [
	['in-memory', () => new InMemoryDataProvider()],
	['node:sqlite', () => new SqlDatabase(new NodeSqliteDataProvider(new DatabaseSync(':memory:')))],
]

const seed = [
	{ id: 1, userId: 'u1' },
	{ id: 2, userId: null },
	{ id: 3, userId: null },
]

describe.each(providers)('FF_Filter owner prefilters (%s)', (_name, makeDp) => {
	for (const entity of [OwnedTask, OwnedOrTask]) {
		it(`${entity.name}: anonymous sees no rows, not the null-owner ones`, async () => {
			const dataProvider = makeDp()
			const backend = new Remult(dataProvider)
			await dataProvider.ensureSchema?.([backend.repo(entity).metadata])
			await backend.repo(entity).insert(seed)

			const api = new Remult(TestApiDataProvider({ dataProvider }))
			expect(await api.repo(entity).find()).toEqual([])
		})
	}

	it('owner: logged-in user sees only own rows', async () => {
		const dataProvider = makeDp()
		const backend = new Remult(dataProvider)
		await dataProvider.ensureSchema?.([backend.repo(OwnedTask).metadata])
		await backend.repo(OwnedTask).insert(seed)

		remult.user = { id: 'u1' } as typeof remult.user
		try {
			const where = FF_Filter.owner<OwnedTask>('userId')
			expect((await backend.repo(OwnedTask).find({ where })).map((t) => t.id)).toEqual([1])
		} finally {
			remult.user = undefined
		}
	})
})
