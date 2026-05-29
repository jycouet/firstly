import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import { dialog, type DialogClose } from './dialog.svelte'
import { ff } from './ff.svelte'
import { toast } from './toast'

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

// Delete always throws - to exercise confirmRemove's failure path.
@Entity<Undeletable>('ff_undeletable', {
	allowApiCrud: true,
	deleting: () => {
		throw new Error('delete blocked')
	},
})
class Undeletable {
	@Fields.id()
	id = ''
	@Fields.string()
	name = ''
}

// A no-op snippet - the dialog store only holds the reference, it never renders in these tests.
const noopSnippet = (() => {}) as unknown as import('svelte').Snippet<[DialogClose]>

async function seed(n: number) {
	await repo(Row).insert(Array.from({ length: n }, (_, i) => ({ order: i + 1, name: `r${i + 1}` })))
}

// Run a body inside an effect root (so the handle's $effects run) and auto-clean.
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

describe('ff().many - load', () => {
	it('loads items in the entity defaultOrderBy', async () => {
		await seed(3)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.loading.init).toBe(false))
		expect(m.items.map((x) => x.order)).toEqual([3, 2, 1])
	})

	it('honours limit', async () => {
		await seed(5)
		const m = root(() => ff(Row).many(() => ({ limit: 2 }), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
	})

	it('re-fetches when where changes (and drops stale results)', async () => {
		await seed(3)
		let min = $state(0)
		const m = root(() => ff(Row).many(() => ({ where: { order: { $gt: min } } }), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(3))
		min = 2
		flushSync()
		await vi.waitFor(() => expect(m.items.map((x) => x.order)).toEqual([3]))
	})

	it('enabled gate: skips while disabled, runs when it flips true', async () => {
		await seed(2)
		let on = $state(false)
		const m = root(() => ff(Row).many(() => ({ enabled: on }), 'load'))
		flushSync()
		expect(m.items).toEqual([])
		on = true
		flushSync()
		await vi.waitFor(() => expect(m.items.length).toBe(2))
	})
})

describe('ff().many - editing (the draft reconciles the list)', () => {
	it('create + save inserts the row at its sorted position', async () => {
		await seed(3) // order 3,2,1
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(3))
		m.create({ order: 10, name: 'x' })
		await m.save()
		await vi.waitFor(() => expect(m.items.length).toBe(4))
		expect(m.items[0]?.order).toBe(10) // placed first by order desc
		expect(await repo(Row).count()).toBe(4)
	})

	it('edit(row) clones in place: instant draft, isolated, save updates', async () => {
		await seed(2)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
		const target = m.items[0]
		m.edit(target) // default: no fetch, draft is a clone - available synchronously
		expect(m.draft?.id).toBe(target.id)
		m.draft!.name = 'edited'
		expect(m.items.find((x) => x.id === target.id)?.name).not.toBe('edited') // isolated until save
		await m.save()
		await vi.waitFor(() => expect(m.items.find((x) => x.id === target.id)?.name).toBe('edited'))
		expect((await repo(Row).findId(target.id))?.name).toBe('edited')
		expect(await repo(Row).count()).toBe(2) // updated, not inserted
	})

	it('edit(row, { refetch: true }) is optimistic: instant draft, swaps in fresh, save updates', async () => {
		await seed(2)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
		const target = m.items[0]
		await repo(Row).update(target.id, { name: 'fresh-from-db' }) // list snapshot is now stale
		m.edit(target, { refetch: true })
		expect(m.draft?.id).toBe(target.id) // optimistic: draft is there synchronously (no undefined gap)
		await vi.waitFor(() => expect(m.draft?.name).toBe('fresh-from-db')) // then the refetch swaps it in
		m.draft!.name = 'refetched'
		await m.save()
		await vi.waitFor(() => expect(m.items.find((x) => x.id === target.id)?.name).toBe('refetched'))
		expect(await repo(Row).count()).toBe(2) // updated, not inserted
	})

	it('edit(plainRow, { refetch: true }) on an untracked row updates, never inserts', async () => {
		await seed(2)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
		const plain = { ...m.items[0] } // a plain spread / $state row, NOT a tracked entity
		m.edit(plain as Row, { refetch: true })
		expect(m.draft?.id).toBe(plain.id) // optimistic existing draft, even from a detached object
		m.draft!.name = 'from-untracked'
		await m.save()
		await vi.waitFor(() =>
			expect(m.items.find((x) => x.id === plain.id)?.name).toBe('from-untracked'),
		)
		expect(await repo(Row).count()).toBe(2) // the existing-marking prevents a duplicate insert
	})

	it('edit(row) works on a composite-PK entity: clones + updates, no insert', async () => {
		await repo(Pair).insert([
			{ a: 'x', b: '1', label: 'one' },
			{ a: 'x', b: '2', label: 'two' },
		])
		const m = root(() => ff(Pair).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
		const target = m.items.find((p) => p.b === '1')!
		m.edit(target) // id is read off the row - no manual getId for composite keys
		expect(m.draft?.b).toBe('1')
		m.draft!.label = 'edited'
		await m.save()
		await vi.waitFor(() => expect(m.items.find((p) => p.b === '1')?.label).toBe('edited'))
		expect(await repo(Pair).count()).toBe(2) // updated, not inserted
	})

	it('remove(row) drops it from the list and the db', async () => {
		await seed(3)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(3))
		await m.remove(m.items[0])
		expect(m.items.length).toBe(2)
		expect(await repo(Row).count()).toBe(2)
	})
})

describe('ff().many - onFirst (seed once from items[0])', () => {
	it('fires once when the first row lands, and never again on later list changes', async () => {
		await seed(3) // order 3,2,1 -> items[0].order === 3 (the latest)
		const seen: number[] = []
		const m = root(() => {
			const h = ff(Row).many(() => ({}), 'load')
			h.onFirst((latest) => seen.push(latest.order))
			return h
		})
		await vi.waitFor(() => expect(seen).toEqual([3]))
		// A later change to the list (insert that becomes items[0]) must NOT re-fire it.
		m.create({ order: 10, name: 'x' })
		await m.save()
		await vi.waitFor(() => expect(m.items[0]?.order).toBe(10))
		expect(seen).toEqual([3])
	})
})

describe('ff().many - confirmRemove', () => {
	it('confirm ok -> removes the row from list + db', async () => {
		await seed(3)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(3))
		const target = m.items[0]
		const p = m.confirmRemove(target, { message: 'Delete?' })
		await vi.waitFor(() => expect(dialog.confirmList.length).toBe(1))
		dialog._resolveConfirm(dialog.confirmList[0].id, true)
		await expect(p).resolves.toEqual({ ok: true, data: undefined })
		expect(m.items.length).toBe(2)
		expect(await repo(Row).count()).toBe(2)
	})

	it('cancel -> no-op, resolves { ok: false }', async () => {
		await seed(3)
		const m = root(() => ff(Row).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(3))
		const p = m.confirmRemove(m.items[0])
		await vi.waitFor(() => expect(dialog.confirmList.length).toBe(1))
		dialog._resolveConfirm(dialog.confirmList[0].id, false)
		await expect(p).resolves.toEqual({ ok: false })
		expect(m.items.length).toBe(3)
		expect(await repo(Row).count()).toBe(3)
	})

	it('failed delete -> toasts, sets error, resolves { ok: false }, does not throw', async () => {
		await repo(Undeletable).insert({ name: 'x' })
		const m = root(() => ff(Undeletable).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(1))
		const spy = vi.spyOn(toast, 'fromError').mockReturnValue('id')
		const p = m.confirmRemove(m.items[0])
		await vi.waitFor(() => expect(dialog.confirmList.length).toBe(1))
		dialog._resolveConfirm(dialog.confirmList[0].id, true)
		await expect(p).resolves.toEqual({ ok: false })
		expect(spy).toHaveBeenCalledOnce()
		expect(m.error).toBeTruthy()
		expect(await repo(Undeletable).count()).toBe(1)
		spy.mockRestore()
	})

	it('toast: false suppresses the error toast', async () => {
		await repo(Undeletable).insert({ name: 'y' })
		const m = root(() => ff(Undeletable).many(() => ({}), 'load'))
		await vi.waitFor(() => expect(m.items.length).toBe(1))
		const spy = vi.spyOn(toast, 'fromError').mockReturnValue('id')
		const p = m.confirmRemove(m.items[0], { toast: false })
		await vi.waitFor(() => expect(dialog.confirmList.length).toBe(1))
		dialog._resolveConfirm(dialog.confirmList[0].id, true)
		await expect(p).resolves.toEqual({ ok: false })
		expect(spy).not.toHaveBeenCalled()
		spy.mockRestore()
	})
})

describe('ff().many - paginate', () => {
	it('pages, exposes hasNextPage + aggregates.$count, and appends with more()', async () => {
		await seed(5)
		const m = root(() => ff(Row).many(() => ({ pageSize: 2 }), 'paginate'))
		await vi.waitFor(() => expect(m.items.length).toBe(2))
		expect(m.hasNextPage).toBe(true)
		await vi.waitFor(() => expect(m.aggregates?.$count).toBe(5))
		await m.more()
		await vi.waitFor(() => expect(m.items.length).toBe(4))
	})

	it('computes a requested aggregate (sum) alongside the page', async () => {
		await seed(5) // order 1..5 -> sum 15
		const m = root(() =>
			ff(Row).many(() => ({ pageSize: 2, aggregate: { sum: ['order'] } }), 'paginate'),
		)
		await vi.waitFor(() => expect(m.aggregates?.$count).toBe(5))
		expect(m.aggregates?.order.sum).toBe(15)
	})
})

describe('ff().one - single record', () => {
	it('loads one record into item, reactive on where change', async () => {
		await seed(3)
		let pick = $state(1)
		const r = root(() => ff(Row).one(() => ({ where: { order: pick } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		pick = 3
		flushSync()
		await vi.waitFor(() => expect(r.item?.order).toBe(3))
	})

	it('no-arg save() persists the current item', async () => {
		await seed(2)
		const r = root(() => ff(Row).one(() => ({ where: { order: 2 } })))
		await vi.waitFor(() => expect(r.item?.name).toBe('r2'))
		r.item!.name = 'edited'
		await r.save()
		expect((await repo(Row).findFirst({ order: 2 }))?.name).toBe('edited')
	})

	it('no-arg delete() removes the current item', async () => {
		await seed(1)
		const r = root(() => ff(Row).one(() => ({ where: { order: 1 } })))
		await vi.waitFor(() => expect(r.item?.order).toBe(1))
		await r.delete()
		await vi.waitFor(() => expect(r.item).toBeUndefined())
		expect(await repo(Row).count()).toBe(0)
	})

	it('save() with no item rejects with a helpful error', async () => {
		const r = root(() => ff(Row).one(() => ({ where: { order: 999 } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		await expect(r.save()).rejects.toThrow(/item/)
	})

	it('composite id: save() inserts first, then updates the same row', async () => {
		const r = root(() => ff(Pair).one(() => ({ where: { a: 'x', b: '1' } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		r.create({ a: 'x', b: '1', label: 'first' })
		await r.save()
		await vi.waitFor(() => expect(r.item?.label).toBe('first'))
		expect(await repo(Pair).count()).toBe(1)
		r.item!.label = 'second'
		await r.save()
		await vi.waitFor(() => expect(r.item?.label).toBe('second'))
		expect(await repo(Pair).count()).toBe(1)
	})

	it('a failed save re-throws and fills error', async () => {
		const r = root(() => ff(Row).one(() => ({ where: { order: -999 } })))
		await vi.waitFor(() => expect(r.loading.init).toBe(false))
		r.create({ order: 1, name: 'BOOM' }) // rejected by field validation
		await expect(r.save()).rejects.toThrow()
		expect(r.error).toBeTruthy()
	})
})

describe('ff() - meta & guards', () => {
	it('exposes entity api permissions through .meta (no runes context needed)', () => {
		expect(ff(Row).meta.apiInsertAllowed()).toBe(true)
		expect(ff(Row).meta.key).toBe('ff_repo_test_rows')
		expect(ff(Locked).meta.apiInsertAllowed()).toBe(false)
		expect(ff(Locked).meta.apiReadAllowed).toBe(true)
	})

	it('a reactive handle constructed outside an effect context throws', () => {
		expect(() => ff(Row).many(() => ({}), 'load')).toThrow()
		expect(() => ff(Row).one(() => ({}))).toThrow()
	})
})
