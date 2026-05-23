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
	@Fields.string()
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
		expect(r.first?.order).toBe(3)
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

describe('ffRepo - firstOnce / draft', () => {
	it('firstOnce fires once with the latest row', async () => {
		await seed(3)
		let seen: Row | null = null
		let calls = 0
		const r = root(() => {
			const a = ffRepo(Row).load(() => ({}))
			a.firstOnce((latest) => {
				seen = latest
				calls++
			})
			return a
		})
		await vi.waitFor(() => expect(seen).not.toBeNull())
		expect(seen!.order).toBe(3)
		await r.insert({ order: 4, name: 'r4' })
		await vi.waitFor(() => expect(r.first?.order).toBe(4))
		expect(calls).toBe(1) // seeded once, not re-fired on later changes
	})

	it('draft seeds editable state from the first row, once', async () => {
		await seed(2)
		const d = root(() =>
			ffRepo(Row)
				.load(() => ({}))
				.draft((l) => ({ name: l?.name ?? '' })),
		)
		await vi.waitFor(() => expect(d.name).toBe('r2'))
	})
})

describe('ffRepo - mutation sync (load)', () => {
	it('insert re-fetches and re-sorts', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(3))
		await r.insert({ order: 9, name: 'r9' })
		await vi.waitFor(() => expect(r.items.length).toBe(4))
		expect(r.first?.order).toBe(9)
	})

	it('delete removes the row locally', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(3))
		await r.delete(r.items[0])
		await vi.waitFor(() => expect(r.items.length).toBe(2))
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

	it('keeps aggregates.$count in sync after a delete', async () => {
		await seed(3)
		const r = root(() => ffRepo(Row).paginate(() => ({ pageSize: 10 })))
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(3))
		await r.delete(r.items[0])
		await vi.waitFor(() => expect(r.aggregates?.$count).toBe(2))
	})
})

describe('ffRepo - one (single record)', () => {
	it('loads one record into item (+ first), reactive on where change', async () => {
		await seed(3)
		let pick = $state(1)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: pick } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		expect(r.first?.order).toBe(1)
		pick = 3
		flushSync()
		await vi.waitFor(() => expect(r.item?.order).toBe(3))
	})

	it('save on the loaded item re-syncs', async () => {
		await seed(2)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 2 } })))
		await vi.waitFor(() => expect(r.item?.name).toBe('r2'))
		r.item!.name = 'edited'
		await r.save(r.item!)
		await vi.waitFor(() => expect(r.item?.name).toBe('edited'))
		expect((await repo(Row).findFirst({ order: 2 }))?.name).toBe('edited')
	})

	it('delete clears the record', async () => {
		await seed(1)
		const r = root(() => ffRepo(Row).one(() => ({ where: { order: 1 } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		await r.delete(r.item!)
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
	it('a failed delete re-throws, fills error, and leaves items intact', async () => {
		await seed(2)
		const r = root(() => ffRepo(Row).load(() => ({})))
		await vi.waitFor(() => expect(r.items.length).toBe(2))
		await expect(r.delete({ id: 'does-not-exist' })).rejects.toThrow()
		expect(r.items.length).toBe(2) // not optimistically removed
		expect(r.error).toBeTruthy() // surfaced reactively too
	})
})
