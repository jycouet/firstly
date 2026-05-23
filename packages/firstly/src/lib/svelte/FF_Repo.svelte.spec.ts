import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import { ffRepo } from './FF_Repo.svelte'

// Minimal test entity. `order` desc is the default sort so we can assert ordering.
@Entity<Row>('ff_repo_test_rows', { allowApiCrud: true, defaultOrderBy: { order: 'desc' } })
class Row {
	@Fields.id()
	id = ''
	@Fields.number()
	order = 0
	@Fields.string<Row>({
		validate: (row) => {
			if (row.name === 'BOOM') throw new Error('name cannot be BOOM')
		},
	})
	name = ''
}

@Entity('ff_repo_locked', {
	allowApiRead: true,
	allowApiInsert: false,
	allowApiUpdate: false,
	allowApiDelete: false,
})
class Locked {
	@Fields.id()
	id = ''
}

// Composite (2-field) primary key, to exercise no-arg save/delete on `.item`.
@Entity<Pair>('ff_repo_pairs', { allowApiCrud: true, id: ['a', 'b'] })
class Pair {
	@Fields.string()
	a = ''
	@Fields.string()
	b = ''
	@Fields.string()
	label = ''
}

const rowRepo = () => repo(Row)

async function seed(n: number) {
	await rowRepo().insert(Array.from({ length: n }, (_, i) => ({ order: i + 1, name: `r${i + 1}` })))
}

// Run a body inside an effect root (so the wrapper's $effects run) and auto-clean.
let stops: Array<() => void> = []
function root<T>(fn: () => T): T {
	let out!: T
	stops.push(
		$effect.root(() => {
			out = fn()
		}),
	)
	flushSync()
	return out
}

beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => {
	stops.forEach((s) => s())
	stops = []
})

describe('ffRepo - load', () => {
	it('loads items in the entity defaultOrderBy', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		expect(r.items.map((x) => x.order)).toEqual([3, 2, 1])
		expect(r.items[0]?.order).toBe(3)
	})

	it('honours limit', async () => {
		await seed(5)
		const r = root(() => ffRepo(Row).load(() => ({ limit: 2 })))
		await vi.waitFor(() => expect(r.items.length).toBe(2))
	})

	it('re-fetches when where changes (and drops stale results)', async () => {
		await seed(3)
		let min = $state(0)
		const r = root(() => ffRepo(Row).load(() => ({ where: { order: { $gt: min } } })))
		await vi.waitFor(() => expect(r.items.length).toBe(3))
		min = 2
		flushSync()
		await vi.waitFor(() => expect(r.items.map((x) => x.order)).toEqual([3]))
	})
})

describe('ffRepo - enabled gate', () => {
	it('skips while disabled, runs when it flips true', async () => {
		await seed(2)
		let on = $state(false)
		const r = root(() => ffRepo(Row).load(() => ({ enabled: on })))
		flushSync()
		expect(r.items).toEqual([])
		on = true
		flushSync()
		await vi.waitFor(() => expect(r.items.length).toBe(2))
	})
})

describe('ffRepo - onFirst', () => {
	it('onFirst fires once with the latest row', async () => {
		await seed(3)
		let seen: Row | null = null
		let calls = 0
		const r = root(() => {
			const a = ffRepo(Row).load(() => ({}))
			a.onFirst((latest) => {
				seen = latest
				calls++
			})
			return a
		})
		await vi.waitFor(() => expect(seen).not.toBeNull())
		expect(seen!.order).toBe(3)
		await r.repo.insert({ order: 4, name: 'r4' })
		await r.refresh()
		await vi.waitFor(() => expect(r.items[0]?.order).toBe(4))
		expect(calls).toBe(1) // seeded once, not re-fired on later changes
	})
})

describe('ffRepo - mutation sync (load)', () => {
	it('refresh re-fetches and re-sorts (after a .repo insert)', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(3))
		await r.repo.insert({ order: 9, name: 'r9' })
		await r.refresh()
		await vi.waitFor(() => expect(r.items.length).toBe(4))
		expect(r.items[0]?.order).toBe(9)
	})

	it('removeItem drops a row locally (after a .repo delete)', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(3))
		const gone = r.items[0]
		await r.repo.delete(gone)
		r.removeItem(gone)
		expect(r.items.length).toBe(2)
		expect(r.items.map((x) => x.order)).toEqual([2, 1])
	})
})

describe('ffRepo - paginate', () => {
	it('pages, exposes hasNextPage + aggregates.$count, and appends with more()', async () => {
		await seed(5)
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 2 })))
		await vi.waitFor(() => expect(r.items.length).toBe(2))
		expect(r.hasNextPage).toBe(true)
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(5))
		await r.more()
		await vi.waitFor(() => expect(r.items.length).toBe(4))
	})

	it('computes a requested aggregate (sum) alongside the page', async () => {
		await seed(5) // order 1..5 -> sum 15
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 2, aggregate: { sum: ['order'] } })))
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(5))
		expect(r.aggregates?.order.sum).toBe(15)
	})

	it('removeItem keeps aggregates.$count in sync', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 10 })))
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(3))
		const gone = r.items[0]
		await r.repo.delete(gone)
		r.removeItem(gone)
		expect(r.aggregates?.$count).toBe(2)
	})
})

describe('ffRepo - one (single record)', () => {
	it('loads one record into item, reactive on where change', async () => {
		await seed(3)
		let pick = $state(1)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: pick } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		expect(r.items[0]?.order).toBe(1)
		pick = 3
		flushSync()
		await vi.waitFor(() => expect(r.item?.order).toBe(3))
	})

	it('save on the loaded item re-syncs', async () => {
		await seed(2)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 2 } })))
		await vi.waitFor(() => expect(r.item?.name).toBe('r2'))
		r.item!.name = 'edited'
		await r.save()
		await vi.waitFor(() => expect(r.item?.name).toBe('edited'))
		expect((await repo(Row).findFirst({ order: 2 }))?.name).toBe('edited')
	})

	it('delete clears the record', async () => {
		await seed(1)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 1 } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		await r.delete()
		await vi.waitFor(() => expect(r.item).toBeUndefined())
		expect(r.items.length).toBe(0)
	})
})

describe('ffRepo - one: no-arg save/delete target item', () => {
	it('save() with no args persists the current item', async () => {
		await seed(2)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 2 } })))
		await vi.waitFor(() => expect(r.item?.name).toBe('r2'))
		r.item!.name = 'edited'
		await r.save()
		await vi.waitFor(() => expect(r.item?.name).toBe('edited'))
		expect((await repo(Row).findFirst({ order: 2 }))?.name).toBe('edited')
	})

	it('delete() with no args removes the current item', async () => {
		await seed(1)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 1 } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		await r.delete()
		await vi.waitFor(() => expect(r.item).toBeUndefined())
		expect(await repo(Row).count()).toBe(0)
	})

	it('save() with no item rejects with a helpful error', async () => {
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 999 } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		await expect(r.save()).rejects.toThrow(/item/)
	})
})

describe('ffRepo - one: composite (2-field) id', () => {
	it('save() inserts the first time, then updates the same row (no duplicate)', async () => {
		const r = root(() => ffRepo(Pair).one(() => ({ where: { a: 'x', b: '1' } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		expect(r.item).toBeUndefined()

		r.create({ a: 'x', b: '1', label: 'first' })
		await r.save() // first save -> INSERT
		await vi.waitFor(() => expect(r.item?.label).toBe('first'))
		expect(await repo(Pair).count()).toBe(1)

		r.item!.label = 'second'
		await r.save() // second save -> UPDATE (must not insert a duplicate)
		await vi.waitFor(() => expect(r.item?.label).toBe('second'))
		expect(await repo(Pair).count()).toBe(1)
	})

	it('delete() removes the current item by its composite id', async () => {
		await repo(Pair).insert({ a: 'y', b: '2', label: 'z' })
		const r = root(() => ffRepo(Pair).one(() => ({ where: { a: 'y', b: '2' } })))
		await vi.waitFor(() => expect(r.item?.label).toBe('z'))
		await r.delete() // no-arg -> deletes .item by (a, b)
		await vi.waitFor(() => expect(r.item).toBeUndefined())
		expect(await repo(Pair).count()).toBe(0)
	})
})

describe('ffRepo - client list reconcilers (load/paginate)', () => {
	it('addItem inserts at top by default; at: bottom / index / -1 (last)', async () => {
		await seed(3) // items: r3, r2, r1
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(3))

		r.addItem(repo(Row).create({ order: 10, name: 'a' }))
		expect(r.items.map((x) => x.name)).toEqual(['a', 'r3', 'r2', 'r1'])

		r.addItem(repo(Row).create({ order: 11, name: 'b' }), { at: 'bottom' })
		expect(r.items.at(-1)?.name).toBe('b')

		r.addItem(repo(Row).create({ order: 12, name: 'c' }), { at: 1 })
		expect(r.items[1]?.name).toBe('c')

		r.addItem(repo(Row).create({ order: 13, name: 'd' }), { at: -1 })
		expect(r.items.at(-1)?.name).toBe('d')
	})

	it('removeItem drops the row and decrements aggregates.$count', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 10 })))
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(3))
		r.removeItem(r.items[0])
		expect(r.items.length).toBe(2)
		expect(r.aggregates?.$count).toBe(2)
	})

	it('addItem increments aggregates.$count', async () => {
		await seed(2)
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 10 })))
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(2))
		r.addItem(repo(Row).create({ order: 9, name: 'x' }))
		expect(r.aggregates?.$count).toBe(3)
		expect(r.items[0]?.name).toBe('x')
	})

	it('updateItem replaces the matching row by id', async () => {
		await seed(2) // r2, r1
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(2))
		const target = { ...r.items[0], name: 'renamed' } as Row
		r.updateItem(target)
		expect(r.items[0]?.name).toBe('renamed')
	})

	it('removeItem resolves a composite (2-field) id', async () => {
		await repo(Pair).insert([
			{ a: 'x', b: '1', label: 'p1' },
			{ a: 'x', b: '2', label: 'p2' },
		])
		const r = root(() => ffRepo(Pair).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(2))
		r.removeItem(r.items[0])
		expect(r.items.length).toBe(1)
	})
})

describe('ffRepo - mode guards', () => {
	it('more() throws outside paginate mode', async () => {
		const r = root(() => ffRepo(Row).load(() => ({})))
		await expect((r as unknown as { more: () => Promise<void> }).more()).rejects.toThrow('paginate')
	})

	// Reactive modes build an $effect, so they need a runes context (component init
	// or $effect.root). In a click handler / async fn use the imperative repo (.repo).
	it('a reactive mode constructed outside an effect context throws', () => {
		expect(() => ffRepo(Row).load(() => ({}))).toThrow()
	})

	it('the imperative repo works with no runes context', async () => {
		await seed(1)
		const found = await ffRepo(Row).repo.findFirst({ order: 1 })
		expect(found?.name).toBe('r1')
	})
})

describe('ffRepo - permissions via meta', () => {
	it('expose the entity api permissions through r.meta', () => {
		const r = root(() => ffRepo(Row).load(() => ({})))
		expect(r.meta.apiInsertAllowed()).toBe(true)
		expect(r.meta.apiUpdateAllowed()).toBe(true)
		expect(r.meta.apiDeleteAllowed()).toBe(true)
		expect(r.meta.apiReadAllowed).toBe(true)
		expect(r.meta.key).toBe('ff_repo_test_rows')

		const locked = root(() => ffRepo(Locked).load(() => ({})))
		expect(locked.meta.apiInsertAllowed()).toBe(false)
		expect(locked.meta.apiReadAllowed).toBe(true)
	})
})

describe('ffRepo - imperative repo (no query, no runes)', () => {
	it('repo.insert / findFirst / findId / save / delete / deleteMany', async () => {
		const r = ffRepo(Row)
		const a = await r.repo.insert({ order: 1, name: 'a' })
		expect((await r.repo.findFirst({ name: 'a' }))?.order).toBe(1)
		expect((await r.repo.findId(a.id))?.name).toBe('a')
		a.name = 'a2'
		await r.repo.save(a)
		expect((await r.repo.findId(a.id))?.name).toBe('a2')
		await r.repo.insert({ order: 2, name: 'b' })
		await r.repo.delete(a)
		expect(await r.repo.count()).toBe(1)
		await r.repo.deleteMany({ where: { order: { $gte: 0 } } })
		expect(await r.repo.count()).toBe(0)
	})

	it('create via repo; meta / permissions available', () => {
		const r = ffRepo(Row)
		expect(r.repo.create({ name: 'x' }).name).toBe('x')
		expect(r.meta.key).toBe('ff_repo_test_rows')
		expect(r.meta.apiInsertAllowed()).toBe(true)
	})
})

describe('ffRepo - mutation error handling', () => {
	it('a failed save re-throws and fills error', async () => {
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: -999 } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		r.create({ order: 1, name: 'BOOM' }) // rejected by the field validation
		await expect(r.save()).rejects.toThrow()
		expect(r.error).toBeTruthy() // surfaced reactively too
	})
})
