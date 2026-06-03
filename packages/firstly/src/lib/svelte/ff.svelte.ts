import type { Snippet } from 'svelte'

import {
	repo as remultRepo,
	type ClassType,
	type EntityFilter,
	type EntityMetadata,
	type EntityOrderBy,
	type GroupByOptions,
	type GroupByResult,
	type MembersOnly,
	type MembersToInclude,
	type NumericKeys,
	type Paginator,
	type QueryOptions,
	type Repository,
} from 'remult'

import type { LocalizedMessage } from '../core/FF_Validators.js'
import { dialog, type DialogClose, type DialogOptions, type DialogResult } from './dialog.svelte.js'

/**
 * `ff` - the firstly reactive layer over a Remult entity, as Svelte runes. Two shapes:
 *
 *   ff(E).many(() => ({ where }), strategy?)  // list + editing draft + writes
 *   ff(E).one(() => ({ where }))              // a single record bound to `item`
 *
 * `many`'s `strategy` is the fetch mode: 'paginate' (page + $count + more(), default), 'listen'
 * (liveQuery, auto-updates), or 'load' (a static one-shot). The handle
 * owns the list (`items`) AND the editing `draft`: `edit(id)` / `create()` / `cancel()`,
 * argless `save()` / `remove()` act on the draft, `save(row)` / `remove(row)` target a row,
 * and the list reconciles itself (load = sorted upsert, paginate = refresh, listen = liveQuery).
 *
 * The options getter is reactive: change `where` / `orderBy` / `enabled` / `pageSize` and the
 * query re-runs (stale in-flight responses dropped; `listen` re-subscribes). `orderBy` defaults
 * to the entity's `defaultOrderBy`. `enabled: false` skips the query (keeps the last result)
 * until it flips true. Read SvelteKit load `data` through a `$derived`, never raw in the getter.
 *
 * `.meta` is kept on every handle (captions / permissions / fields). There is NO `.repo`:
 * everything imperative goes through remult's `repo(E)` directly (`insert` / `findId` / `count` /
 * `deleteMany` / ...). The reactive shapes build an `$effect`, so create them at component init;
 * for a click handler / async fn use `repo(E)`. A failed write fills `error` and re-throws.
 *
 * Internals (FF_RepoHandle modes load/live/paginate/one, the `.syncs` link, reconcilers) are
 * private to this module; `ff` exposes only `many` / `one`.
 */

/** The aggregate request shape - remult's `GroupByOptions` minus the grouping/paging keys. */
export type AggregateOptions<Entity> = Omit<
	GroupByOptions<
		Entity,
		never,
		NumericKeys<Entity>[],
		NumericKeys<Entity>[],
		(keyof MembersOnly<Entity>)[],
		(keyof MembersOnly<Entity>)[],
		(keyof MembersOnly<Entity>)[]
	>,
	'group' | 'orderBy' | 'where' | 'limit' | 'page'
>

/**
 * Remult `QueryOptions` plus the `aggregate` request shape. Exported for callers
 * that build query options outside `ff` (e.g. a generic table component).
 */
export type QueryOptionsHelper<Entity> = QueryOptions<Entity> & {
	aggregate?: AggregateOptions<Entity>
}

/** The primary-key type of an entity (single value, or a composite-id object) - from remult's `findId`. */
export type FF_Id<Entity> = Parameters<Repository<Entity>['findId']>[0]

export type FF_RepoOptions<Entity> = {
	where?: EntityFilter<Entity>
	/** `one` mode: load by primary key via `findId` (no sort/limit). Mutually exclusive with `where`. */
	id?: FF_Id<Entity>
	orderBy?: EntityOrderBy<Entity>
	/** paginate: rows per page (default 25). */
	pageSize?: number
	/** find/one/live: cap the rows returned. No default - returns every matching row. */
	limit?: number
	include?: MembersToInclude<Entity>
	/** When false, the query is skipped (last result kept) until it flips true. */
	enabled?: boolean
	/** Aggregations to compute alongside the page (paginate mode only). `$count` is always returned. */
	aggregate?: AggregateOptions<Entity>
}

/**
 * Options for `ff(E).one(...)`: load a single record either by primary key
 * (`id` -> `findId`, no sort/limit) OR by filter (`where` -> `findFirst`, with `orderBy`).
 * Exactly one of `id` / `where` - setting both is a type error.
 */
export type FF_OneOptions<Entity> = {
	include?: MembersToInclude<Entity>
	enabled?: boolean
} & (
	| { id: FF_Id<Entity>; where?: never; orderBy?: never }
	| { id?: never; where?: EntityFilter<Entity>; orderBy?: EntityOrderBy<Entity> }
)
type Getter<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = () => O

/** `$count` is always present; richer keys appear only for the requested `aggregate`. */
type EmptyAggregateResult = { $count: number }

/** The typed aggregate result for a given options object (paginate mode). */
type ExtractAggregateResult<Entity, O extends FF_RepoOptions<Entity>> = O extends {
	aggregate: infer A
}
	? GroupByResult<
			Entity,
			never,
			A extends { sum?: infer S } ? (S extends NumericKeys<Entity>[] ? S : never) : never,
			A extends { avg?: infer V } ? (V extends NumericKeys<Entity>[] ? V : never) : never,
			A extends { min?: infer M } ? (M extends NumericKeys<Entity>[] ? M : never) : never,
			A extends { max?: infer X } ? (X extends NumericKeys<Entity>[] ? X : never) : never,
			A extends { distinctCount?: infer D }
				? D extends (keyof MembersOnly<Entity>)[]
					? D
					: never
				: never
		>
	: EmptyAggregateResult

export type FF_RepoLoading = {
	init: boolean // first load not done yet
	fetching: boolean // a read is in flight
	more: boolean // loading the next page
	saving: boolean // insert/update in flight
	deleting: boolean // delete in flight
}

/**
 * What `onIssue` reports when a read doesn't yield the expected data:
 * - `notFound`  - a `one` query resolved with no row (status 404)
 * - `forbidden` - the API rejected the read (status 403, e.g. permissions)
 * - `error`     - any other failure (network, server, ...)
 *
 * `status`/`message` are best-effort, read off the underlying error when present.
 * Switch on `kind` to react (e.g. redirect on `notFound`/`forbidden`).
 */
export type FF_Issue = {
	kind: 'notFound' | 'forbidden' | 'error'
	status?: number
	message?: string
}

/** Classify a thrown read error into an {@link FF_Issue} (best-effort status sniffing). */
function toIssue(e: unknown): FF_Issue {
	const err = e as { httpStatusCode?: number; status?: number; message?: string } | undefined
	const status = err?.httpStatusCode ?? err?.status
	const message = e instanceof Error ? e.message : typeof e === 'string' ? e : err?.message
	const kind: FF_Issue['kind'] = status === 403 ? 'forbidden' : status === 404 ? 'notFound' : 'error'
	return { kind, status, message }
}

type Mode = 'live' | 'load' | 'paginate' | 'one'

/**
 * The reactive handle implementation (internal). `ff().one()` returns an Omit'd view of this
 * (`FF_One`); `ff().many()` wraps a list handle + a `.syncs`-linked one in `FF_ManyHandle`
 * (exposed as `FF_Many`). The per-mode aliases below stay internal to this module.
 */
class FF_RepoHandle<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> {
	#repo: Repository<Entity>
	#opts: Getter<Entity, O>
	#mode: Mode
	#defaultOrderBy?: EntityOrderBy<Entity>
	#paginator?: Paginator<Entity>
	#seq = 0
	#syncTargets: FF_RepoHandle<Entity>[] = []
	#onNewCbs: Array<(items: Entity[]) => void> = []
	#onIssueCbs: Array<(issue: FF_Issue) => void> = []

	items = $state<Entity[]>([])
	/** Single-record slot: the loaded row in `one` mode, or a create/edit draft (see `create`). */
	item = $state<Entity | undefined>(undefined)
	loading = $state<FF_RepoLoading>({
		init: true,
		fetching: false,
		more: false,
		saving: false,
		deleting: false,
	})
	error = $state<string | undefined>(undefined)
	hasNextPage = $state(false)
	/** Aggregations for the whole query (paginate mode). `aggregates.$count` is the total row count. */
	aggregates = $state<ExtractAggregateResult<Entity, O> | undefined>(undefined)

	/** Any read or write currently in flight (init/fetching/more/saving/deleting). */
	get isBusy(): boolean {
		const l = this.loading
		return l.init || l.fetching || l.more || l.saving || l.deleting
	}
	/** A write (insert/update/delete) in flight. */
	get isWriting(): boolean {
		return this.loading.saving || this.loading.deleting
	}

	constructor(r: Repository<Entity>, opts: Getter<Entity, O>, mode: Mode) {
		this.#repo = r
		this.#opts = opts
		this.#mode = mode
		this.#defaultOrderBy = r.metadata.options.defaultOrderBy as EntityOrderBy<Entity> | undefined

		$effect(() => {
			const o = this.#resolve()
			if (o.enabled === false) {
				this.loading.init = false
				return
			}
			if (mode === 'live') {
				// Pass orderBy so liveQuery re-sorts incrementally-added rows too;
				// without it a freshly inserted row is appended and `items[0]` (the latest) goes stale.
				const unsub = this.#repo
					.liveQuery({ where: o.where, orderBy: o.orderBy, limit: o.limit, include: o.include })
					.subscribe({
						next: (info) => {
							this.items = info.items
							this.loading.init = false
							this.#fireNew()
						},
						error: (e) => {
							this.error = e instanceof Error ? e.message : String(e)
							this.loading.init = false
							this.#fireIssue(toIssue(e))
						},
					})
				return () => unsub()
			}
			// load | paginate | one: (re)fetch; a newer opts() invalidates older responses.
			void this.#load(o, ++this.#seq)
		})
	}

	#resolve(): FF_RepoOptions<Entity> {
		const o = this.#opts()
		return { ...o, orderBy: o.orderBy ?? this.#defaultOrderBy }
	}

	async #load(o: FF_RepoOptions<Entity>, seq: number, keepCount?: number) {
		this.loading.fetching = true
		this.error = undefined
		try {
			if (this.#mode === 'paginate') {
				// One request returns the page AND the aggregates ($count always, plus any
				// requested): on the client REST proxy remult fetches both together. It sets
				// `hasNextPage` from whether a full page came back (no count probe); `more()`
				// then fetches the next page via a keyset cursor (orderBy + PK).
				const p = await this.#repo
					.query({
						where: o.where,
						orderBy: o.orderBy,
						pageSize: keepCount ?? o.pageSize ?? 25,
						include: o.include,
						aggregate: { ...o.aggregate },
					})
					.paginator()
				if (seq !== this.#seq) return
				this.#paginator = p
				this.items = p.items
				this.hasNextPage = p.hasNextPage
				// `aggregates` is only on the paginator type when the aggregate is non-empty,
				// but remult returns `$count` for the empty case too - so read it through a cast.
				this.aggregates = (p as unknown as { aggregates: ExtractAggregateResult<Entity, O> }).aggregates
				this.#fireNew()
			} else if (this.#mode === 'one') {
				// `id` -> findId (by primary key, no sort/limit); otherwise `where` -> findFirst.
				const found =
					o.id != null
						? await this.#repo.findId(o.id, { include: o.include })
						: await this.#repo.findFirst(o.where, { orderBy: o.orderBy, include: o.include })
				if (seq !== this.#seq) return
				this.item = found ?? undefined
				this.items = found ? [found] : []
				this.#fireNew()
				// A `one` query that resolves with no row is a not-found (the row was
				// deleted, the id is wrong, or a prefilter hid it) - report it so callers
				// can redirect/404 instead of sitting on an empty record.
				if (!found) this.#fireIssue({ kind: 'notFound', status: 404 })
			} else {
				const items = await this.#repo.find({
					where: o.where,
					orderBy: o.orderBy,
					limit: o.limit,
					include: o.include,
				})
				if (seq !== this.#seq) return
				this.items = items
				this.#fireNew()
			}
		} catch (e) {
			if (seq === this.#seq) {
				this.error = e instanceof Error ? e.message : String(e)
				this.#fireIssue(toIssue(e))
			}
		} finally {
			if (seq === this.#seq) {
				this.loading.init = false
				this.loading.fetching = false
			}
		}
	}

	/** Re-run the current query (load/paginate/one), back to the first page. */
	async refresh() {
		if (this.#mode === 'live') throw new Error('FF_Repo: refresh() is not available in live mode')
		await this.#load(this.#resolve(), ++this.#seq)
	}

	/** Load and append the next page (paginate mode). */
	async more() {
		if (this.#mode !== 'paginate') throw new Error('FF_Repo: more() requires paginate mode')
		if (!this.#paginator || this.loading.more || !this.hasNextPage) return
		const seq = this.#seq
		this.loading.more = true
		try {
			const next = await this.#paginator.nextPage()
			// A newer query (where/orderBy/pageSize changed) ran while this page was in flight:
			// drop the stale page rather than appending it to the new result.
			if (seq !== this.#seq) return
			this.#paginator = next
			this.items = [...this.items, ...next.items]
			this.hasNextPage = next.hasNextPage
		} finally {
			this.loading.more = false
		}
	}

	/**
	 * Run `fn` once - the first time a row exists (`items[0]`).
	 *
	 * The point: seed editable UI state from the latest row WITHOUT a live query
	 * clobbering in-progress edits. It fires a single time, on the first non-empty
	 * result, and never again - later ticks (an edit, a delete, a re-sort) are
	 * ignored. Empty snapshots are skipped (a liveQuery often emits one before the
	 * data lands; there is nothing to seed from an empty result).
	 *
	 * For pure derived state prefer `$derived`; reach for `onFirst` only when the
	 * seed must become independently editable (a draft the user then mutates).
	 *
	 * ```svelte
	 * const list = ff(Plan).many(() => ({ where: { ownerDid } }), 'listen')
	 * let draft = $state({ title: '' })
	 * list.onFirst((latest) => (draft.title = latest.title)) // seed once, then edit freely
	 * ```
	 */
	onFirst(fn: (latest: Entity) => void): this {
		let done = false
		$effect(() => {
			if (done) return
			const latest = this.items[0]
			if (latest == null) return
			fn(latest)
			done = true
		})
		return this
	}

	#fireNew() {
		if (this.#onNewCbs.length) for (const fn of this.#onNewCbs) fn(this.items)
	}
	#fireIssue(issue: FF_Issue) {
		if (this.#onIssueCbs.length) for (const fn of this.#onIssueCbs) fn(issue)
	}

	/**
	 * Run `fn` after EVERY successful read, with the fresh `items` (mimics the old
	 * `storeList`/`storeItem` `onNewData` callback). Unlike `onFirst` (once, on the
	 * first non-empty), this fires on each load / refresh / paginate page / live tick.
	 * In `one` mode `items` is `[record]` (or `[]` when not found). Chainable.
	 */
	onNew(fn: (items: Entity[]) => void): this {
		this.#onNewCbs.push(fn)
		return this
	}

	/**
	 * Run `fn` when a read doesn't yield the expected data: a `one` query with no row
	 * (`notFound`), a rejected read (`forbidden`, 403), or any other failure (`error`).
	 * The arg is an `FF_Issue` ({@link FF_Issue}) - switch on `issue.kind` to react,
	 * e.g. redirect on not-found. Chainable.
	 *
	 * ```svelte
	 * const site = ff(Site).one(() => ({ where: { id } }))
	 *   .onIssue((i) => { if (i.kind === 'notFound') goto('/app/sites') })
	 * ```
	 */
	onIssue(fn: (issue: FF_Issue) => void): this {
		this.#onIssueCbs.push(fn)
		return this
	}

	/** Create a new unsaved entity into the `item` slot (for an edit form). */
	create(...args: Parameters<Repository<Entity>['create']>) {
		this.item = this.#repo.create(...args)
		return this.item
	}

	// Mutations: run `op`, then the post-write sync on SUCCESS only (a failed write
	// leaves the result untouched). On failure we fill `error` AND re-throw - the
	// caller still gets the rejection (not silenced); `error` is for a reactive
	// UI that wants it. `finally` only flips `loading` (no `await`, which would
	// mask the original error).
	async #write<T>(
		flag: 'saving' | 'deleting',
		op: () => Promise<T>,
		after: () => void | Promise<void>,
	): Promise<T> {
		this.loading[flag] = true
		for (const t of this.#syncTargets) t.loading[flag] = true
		this.error = undefined
		try {
			const res = await op()
			await after()
			return res
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e)
			throw e
		} finally {
			this.loading[flag] = false
			for (const t of this.#syncTargets) t.loading[flag] = false
		}
	}

	/** Save the current `item` (from `one` / `create()`). To save a specific row, use remult `repo(E).save(row)`. */
	async save() {
		const saved = await this.#write(
			'saving',
			() => this.#repo.save(this.#requireItem()),
			() => this.#resync(),
		)
		this.item = saved
		for (const t of this.#syncTargets) t.reconcile(saved)
		return saved
	}

	/** Delete the current `item`. To delete a specific row/id, use remult `repo(E).delete(idOrRow)`. */
	async delete() {
		const target = this.#requireItem()
		const res = await this.#write(
			'deleting',
			() => this.#repo.delete(target),
			() => {
				// live: liveQuery removes it. one: re-fetch (likely empty now).
				// load/paginate: drop it locally (no refetch).
				if (this.#mode === 'live') return
				if (this.#mode === 'one') return this.#resync()
				this.#removeLocal(target)
			},
		)
		for (const t of this.#syncTargets)
			t.removeItem(target as Parameters<Repository<Entity>['delete']>[0])
		return res
	}

	/**
	 * Save a specific `row` through this list handle's loading/error machinery (mirrors the
	 * argless `save()`), then reconcile the list (sorted upsert / paginate refresh). Used by
	 * `FF_ManyHandle.save(target)` so a targeted write flips `loading.saving` and fills `error`.
	 */
	async saveRow(row: Entity) {
		let saved: Entity
		await this.#write(
			'saving',
			async () => (saved = await this.#repo.save(row)),
			() => this.reconcile(saved),
		)
		return saved!
	}

	/**
	 * Delete a specific `row` through this list handle's loading/error machinery (mirrors the
	 * argless `delete()`), then drop it from the list. Used by `FF_ManyHandle.remove(target)`.
	 */
	async deleteRow(row: Entity) {
		await this.#write(
			'deleting',
			() => this.#repo.delete(row as Parameters<Repository<Entity>['delete']>[0]),
			() => this.removeItem(row as Parameters<Repository<Entity>['delete']>[0]),
		)
	}

	/**
	 * Link this record handle (`one`) to one or more list handles. On `save()` /
	 * `delete()` the lists are reconciled (sorted upsert / remove) and share the
	 * write-loading flag, so the list area shows "busy" during the write too. A live
	 * list reconcile is a no-op (its liveQuery already syncs). Returns `this`.
	 */
	syncs(...targets: Array<FF_RepoLoad<Entity> | FF_RepoPaginate<Entity> | FF_RepoLive<Entity>>) {
		this.#syncTargets = targets as unknown as FF_RepoHandle<Entity>[]
		return this
	}

	/** The current `item` (or throw) - backs the argless `save()`/`delete()`. */
	#requireItem(): Entity {
		if (this.item === undefined)
			throw new Error(
				'FF_Repo: no `item` to save/delete - load one first (`one` mode or `create()`), or write a specific row through remult `repo(E)`.',
			)
		return this.item
	}

	// Client-side list reconcilers (no server I/O) - reflect a change you made
	// elsewhere (e.g. via remult `repo(E)`) in the reactive `items`. `load`/`paginate` only;
	// `listen` reconciles itself via the liveQuery. `add`/`remove` also adjust
	// `aggregates.$count` (not the other aggregates). For authoritative state, call
	// `refresh()` (it re-pulls and, for paginate, resets to the first page).

	/** Insert into `items` at `top` (default) / `bottom` / an index (`-1` = last). +1 to `$count`. */
	addItem(item: Entity, options?: { at?: 'top' | 'bottom' | number }) {
		const at = options?.at ?? 'top'
		const list = this.items
		const idx =
			at === 'top'
				? 0
				: at === 'bottom'
					? list.length
					: at < 0
						? Math.max(0, list.length + at + 1)
						: Math.min(at, list.length)
		this.items = [...list.slice(0, idx), item, ...list.slice(idx)]
		if (this.aggregates) this.aggregates.$count += 1
	}

	/** Replace the row whose id matches `item`'s id (no `$count` change). */
	updateItem(item: Entity) {
		const id = this.#repo.metadata.idMetadata.getId(item)
		this.items = this.items.map((x) => (this.#repo.metadata.idMetadata.getId(x) === id ? item : x))
	}

	/** Drop the matching row (pass an id or the item). -1 to `$count`. */
	removeItem(idOrItem: Parameters<Repository<Entity>['delete']>[0]) {
		if (this.#mode === 'live') return
		this.#removeLocal(idOrItem)
	}

	/**
	 * Insert-or-update `item` at its SORTED position (load mode), recomputing the index
	 * from this handle's `orderBy` plus the entity id as tiebreak. Paginate re-fetches
	 * (a row may belong to an unloaded page); live is a no-op (the liveQuery syncs).
	 */
	reconcile(item: Entity) {
		if (this.#mode === 'live') return
		if (this.#mode === 'paginate') {
			void this.refresh()
			return
		}
		const id = this.#repo.metadata.idMetadata.getId(item)
		const without = this.items.filter((x) => this.#repo.metadata.idMetadata.getId(x) !== id)
		const cmp = this.#comparator(this.#resolve().orderBy)
		let idx = without.findIndex((x) => cmp(item, x) < 0)
		if (idx < 0) idx = without.length
		this.items = [...without.slice(0, idx), item, ...without.slice(idx)]
	}

	// A comparator from an EntityOrderBy, with the entity id appended as a stable
	// tiebreak (remult does the same so keyset paging is deterministic).
	#comparator(orderBy: EntityOrderBy<Entity> | undefined) {
		const entries = Object.entries(orderBy ?? {}) as [string, 'asc' | 'desc'][]
		const idOf = (e: Entity) => this.#repo.metadata.idMetadata.getId(e)
		return (a: Entity, b: Entity): number => {
			for (const [field, dir] of entries) {
				const av = (a as Record<string, unknown>)[field] as never
				const bv = (b as Record<string, unknown>)[field] as never
				if (av < bv) return dir === 'desc' ? 1 : -1
				if (av > bv) return dir === 'desc' ? -1 : 1
			}
			const ai = idOf(a)
			const bi = idOf(b)
			return ai < bi ? -1 : ai > bi ? 1 : 0
		}
	}

	#removeLocal(idOrItem: unknown) {
		const id =
			idOrItem != null && typeof idOrItem === 'object'
				? this.#repo.metadata.idMetadata.getId(idOrItem as Entity)
				: idOrItem
		this.items = this.items.filter((i) => this.#repo.metadata.idMetadata.getId(i) !== id)
		if (this.aggregates) this.aggregates.$count = Math.max(0, this.aggregates.$count - 1)
	}

	/** After insert/update (or a `one` delete) in a non-live mode, re-fetch keeping the current count. */
	async #resync() {
		if (this.#mode === 'live') return
		const keepCount = this.#mode === 'paginate' ? this.items.length || undefined : undefined
		await this.#load(this.#resolve(), ++this.#seq, keepCount)
	}

	/**
	 * The entity's remult metadata - the single escape hatch for everything not on
	 * this handle: permissions (`apiInsertAllowed()`, `apiUpdateAllowed(item)`,
	 * `apiDeleteAllowed(item)`, `apiReadAllowed`), `fields`, `idMetadata`, `options`,
	 * `key`. Reflects the current `remult.user`.
	 */
	get meta(): EntityMetadata<Entity> {
		return this.#repo.metadata
	}

	/** Escape hatch to the underlying repo (count, findId, upsert, projections, ...). */
	get repo(): Repository<Entity> {
		return this.#repo
	}
}

/** load: one-shot list (`refresh()` to re-run) - a read+reconcile view. No paging/aggregates, and no `item`/`save`/`delete`/`create` (edit via `one`, write via remult `repo(E)`). */
export type FF_RepoLoad<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoHandle<Entity, O>,
	'more' | 'hasNextPage' | 'aggregates' | 'item' | 'save' | 'delete' | 'create' | 'syncs'
>
/** live: reactive subscription, auto-updates - a read view. No refresh/paging/aggregates/reconcilers (the liveQuery does it), and no `item`/`save`/`delete`/`create`. */
export type FF_RepoLive<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoHandle<Entity, O>,
	| 'refresh'
	| 'more'
	| 'hasNextPage'
	| 'aggregates'
	| 'addItem'
	| 'updateItem'
	| 'removeItem'
	| 'item'
	| 'save'
	| 'delete'
	| 'create'
	| 'reconcile'
	| 'syncs'
>
/** paginate: `more()` / `hasNextPage` / `aggregates` - a read+reconcile view. No `onFirst` (paged ≠ latest), and no `item`/`save`/`delete`/`create`. */
export type FF_RepoPaginate<
	Entity,
	O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>,
> = Omit<FF_RepoHandle<Entity, O>, 'onFirst' | 'item' | 'save' | 'delete' | 'create' | 'syncs'>
/** one: a single reactive record in `item`. No paging / aggregates / list reconcilers. */
export type FF_RepoOne<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoHandle<Entity, O>,
	'more' | 'hasNextPage' | 'aggregates' | 'addItem' | 'updateItem' | 'removeItem' | 'reconcile'
>

/** The list strategy backing `many`. Maps `listen` → live mode internally. */
export type ManyStrategy = 'load' | 'listen' | 'paginate'

/**
 * Style 1 - unified composite. One handle owning a list (load/listen/paginate) AND
 * the current editing `draft`, pre-wired: the draft handle `.syncs(list)`, so saving
 * or deleting reconciles the list (sorted upsert / remove) and loading/error are
 * merged across both. Proves the styles share internals: this is just a list handle
 * plus a `.syncs()`-linked `one` handle.
 *
 *   const t = ff(Task).many(() => ({ where }), 'load')
 *   t.edit(row) / t.create() / t.save() / t.remove(row) / t.cancel()
 *   markup reads t.items, t.draft, t.loading, t.isBusy, t.error
 */
class FF_ManyHandle<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> {
	#repo: Repository<Entity>
	#idKey: string
	#list: FF_RepoHandle<Entity, O>
	#editor: FF_RepoHandle<Entity, O>
	#editingId = $state<string | null>(null)

	constructor(r: Repository<Entity>, opts: Getter<Entity, O>, strategy: ManyStrategy) {
		this.#repo = r
		this.#idKey = r.metadata.idMetadata.field.key
		this.#list = new FF_RepoHandle<Entity, O>(r, opts, strategy === 'listen' ? 'live' : strategy)
		this.#editor = new FF_RepoHandle<Entity, O>(
			r,
			(() => ({
				where: { [this.#idKey]: this.#editingId ?? '' } as EntityFilter<Entity>,
				enabled: this.#editingId !== null,
			})) as Getter<Entity, O>,
			'one',
		)
		this.#editor.syncs(this.#list as unknown as FF_RepoLoad<Entity>)
	}

	get items(): Entity[] {
		return this.#list.items
	}
	get draft(): Entity | undefined {
		return this.#editor.item
	}
	set draft(v: Entity | undefined) {
		this.#editor.item = v
	}
	get error(): string | undefined {
		return this.#editor.error ?? this.#list.error
	}
	get hasNextPage(): boolean {
		return this.#list.hasNextPage
	}
	get aggregates(): ExtractAggregateResult<Entity, O> | undefined {
		return this.#list.aggregates
	}

	/** Merged loading: list reads + draft writes. */
	get loading(): FF_RepoLoading {
		const l = this.#list.loading
		const e = this.#editor.loading
		return {
			init: l.init,
			fetching: l.fetching || e.fetching,
			more: l.more,
			// Targeted writes (`save(row)`/`remove(row)`) flip the list flags; argless draft
			// writes flip the editor flags (and propagate to the list via `.syncs`). Merge both.
			saving: e.saving || l.saving,
			deleting: e.deleting || l.deleting,
		}
	}
	get isBusy(): boolean {
		const l = this.loading
		return l.init || l.fetching || l.more || l.saving || l.deleting
	}
	get isWriting(): boolean {
		return this.loading.saving || this.loading.deleting
	}

	/**
	 * Load `row` into `draft` for editing. Pass the row itself (works with any PK,
	 * single or composite - the id is read off it).
	 *
	 * Default (no fetch): edits an isolated **clone** of `row` - instant, no flicker,
	 * and saving updates the original (the clone keeps remult's existing-row state).
	 * Cancelling just drops the clone, so the list row is untouched until save.
	 *
	 * `{ refetch: true }`: optimistic - put `row`'s structure into `draft` **immediately**
	 * (so a form renders at full size, no open-then-grow flicker), then re-read the row
	 * fresh from the data source and swap it in. The optimistic draft is marked as an
	 * **existing** row (rebuilt via json), so it works whether `row` is a tracked entity,
	 * a plain spread/`$state` object, or an id-only stub - and saving updates, never inserts.
	 * Use it when the list row may be stale or you only hold its id.
	 */
	edit(row: Entity, opts?: { refetch?: boolean }) {
		if (opts?.refetch) {
			this.#editor.item = this.#repo.fromJson(this.#repo.toJson(this.#repo.create(row)), false)
			this.#editingId = this.#repo.metadata.idMetadata.getId(row) as string
		} else {
			this.#editingId = null // keep the editor's query disabled; the clone is the draft
			this.#editor.item = this.#repo.getEntityRef(row).clone()
		}
	}
	/** Start a blank `draft` (insert). */
	create(...args: Parameters<Repository<Entity>['create']>) {
		this.#editingId = null
		return this.#editor.create(...args)
	}
	/** Drop the draft / stop editing, and clear any pending error. */
	cancel() {
		this.#editingId = null
		this.#editor.item = undefined
		this.#editor.error = undefined
	}
	/** Save `target` (any row) or, argless, the current `draft`; reconciles the list. */
	async save(target?: Entity) {
		if (target !== undefined) {
			// Route through the list handle's loading/error machinery (same as the argless path),
			// then reconcile - so a targeted save flips `loading.saving` and fills/clears `error`.
			return this.#list.saveRow(target)
		}
		const saved = await this.#editor.save()
		this.cancel()
		return saved
	}
	/** Delete `target` (any row) or, argless, the current `draft`; reconciles the list. */
	async remove(target?: Entity) {
		if (target !== undefined) {
			// Route through the list handle's loading/error machinery (same as the argless path),
			// then drop the row - so a targeted remove flips `loading.deleting` and fills/clears `error`.
			await this.#list.deleteRow(target)
			return
		}
		await this.#editor.delete()
		this.cancel()
	}

	/**
	 * Confirm, then remove `row`. Resolves `{ ok: true }` when removed, `{ ok: false }` when the
	 * user cancels OR the delete fails (a failure also fills `error` and, unless `toast: false`,
	 * shows `toast.fromError`). Never re-throws - safe for `onclick={() => list.confirmRemove(row)}`.
	 */
	async confirmRemove(
		row: Entity,
		opts?: {
			message?: LocalizedMessage
			title?: LocalizedMessage
			confirmLabel?: LocalizedMessage
			cancelLabel?: LocalizedMessage
			/** Style the confirm as destructive. Default true (it's a delete). */
			danger?: boolean
			/** Auto-show `toast.fromError` when the delete fails. Default true. */
			toast?: boolean
		},
	): Promise<DialogResult<void>> {
		const c = await dialog.confirm(opts?.message ?? 'Delete this item?', {
			title: opts?.title,
			confirmLabel: opts?.confirmLabel,
			cancelLabel: opts?.cancelLabel,
			danger: opts?.danger ?? true,
		})
		if (!c.ok) return { ok: false }
		try {
			await this.remove(row)
			return { ok: true, data: undefined }
		} catch (e) {
			if (opts?.toast !== false) {
				// Lazy import keeps `ff` users who never toast from pulling svelte-sonner.
				const { toast } = await import('./toast.js')
				toast.fromError(e)
			}
			return { ok: false }
		}
	}

	/**
	 * Edit `row` in a dialog: seed `draft` (a clone, or `{ refetch: true }` to re-read fresh),
	 * open `body`, and always `cancel()` on close. The `body` snippet binds `draft` and calls
	 * `save()` itself (so a failed/validation save keeps the dialog open via `error`); this method
	 * owns only the seed + cleanup. Resolves the dialog's `DialogResult`.
	 */
	async editInDialog<T = unknown>(
		row: Entity,
		body: Snippet<[DialogClose<T>]>,
		opts?: DialogOptions & { refetch?: boolean },
	): Promise<DialogResult<T>> {
		this.edit(row, { refetch: opts?.refetch })
		try {
			return await dialog.show<T>(body, opts)
		} finally {
			this.cancel()
		}
	}

	/**
	 * Create in a dialog: start a blank `draft` (optionally seeded with `defaults`), open `body`,
	 * and always `cancel()` on close. The `body` binds `draft` and calls `save()` itself.
	 */
	async createInDialog<T = unknown>(
		body: Snippet<[DialogClose<T>]>,
		opts?: DialogOptions & { defaults?: Parameters<Repository<Entity>['create']>[0] },
	): Promise<DialogResult<T>> {
		this.create(opts?.defaults)
		try {
			return await dialog.show<T>(body, opts)
		} finally {
			this.cancel()
		}
	}

	more() {
		return this.#list.more()
	}
	refresh() {
		return this.#list.refresh()
	}
	/**
	 * Seed editable state once, from the latest row (`items[0]`), the first time one
	 * lands - then never again, so a later live tick can't clobber an in-progress edit.
	 * Use it when the seed must become independently editable (a separate `$state` /
	 * `$bindable` the user then mutates), not the draft; for pure display prefer
	 * `$derived(handle.items[0])`. Delegates to the list handle (see `onFirst` there).
	 */
	onFirst(fn: (latest: Entity) => void): this {
		this.#list.onFirst(fn)
		return this
	}
	/** Run `fn` after every successful list read, with the fresh `items`. Delegates to the list handle. Chainable. */
	onNew(fn: (items: Entity[]) => void): this {
		this.#list.onNew(fn)
		return this
	}
	/** Run `fn` when a list read fails (`forbidden`/`error`). Delegates to the list handle. Chainable. */
	onIssue(fn: (issue: FF_Issue) => void): this {
		this.#list.onIssue(fn)
		return this
	}
	get meta(): EntityMetadata<Entity> {
		return this.#repo.metadata
	}
	get repo(): Repository<Entity> {
		return this.#repo
	}
}

// A thunk skips TS's excess-property check on its returned object literal (the
// return type is inferred, then assignability-checked, which allows extra keys).
// Intersecting with `never` on the extra keys forces unknown top-level keys (typos)
// to error. NOTE: this only guards the option keys; a bogus field *inside*
// where/orderBy follows remult's own (looser) EntityFilter/EntityOrderBy types.
type StrictGetter<Entity, O extends FF_RepoOptions<Entity>> = () => O &
	Record<Exclude<keyof O, keyof FF_RepoOptions<Entity>>, never>

/* ---------------------------------------------------------------------------
 * `ff` - the v2 surface: two public shapes.
 *   ff(E).many(getter, strategy?)  -> crud composite (list + draft + writes)
 *   ff(E).one(getter)              -> a single bound record
 * `load`/`listen`/`paginate` are the `strategy`, not verbs. Imperative work goes
 * through remult's `repo(E)` (no `.repo` here on purpose). `.meta` is kept.
 * ------------------------------------------------------------------------- */

/** The `ff(E).many(...)` handle. The `paginate` strategy adds `more`/`hasNextPage`/`aggregates`/`$count`. */
export type FF_Many<
	Entity,
	S extends ManyStrategy = 'paginate',
	O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>,
> = Omit<FF_ManyHandle<Entity, O>, 'repo' | 'more' | 'hasNextPage' | 'aggregates'> &
	(S extends 'paginate'
		? Pick<FF_ManyHandle<Entity, O>, 'more' | 'hasNextPage' | 'aggregates'>
		: Record<never, never>)

/** The `ff(E).one(...)` handle - a single reactive record in `item` (no list/repo/syncs). */
export type FF_One<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoOne<Entity, O>,
	'repo' | 'syncs'
>

/** Builder from `ff(E)`: the two reactive shapes + `meta`. No `.repo` (use remult's `repo(E)`). */
export type FF_Builder<Entity> = {
	/** A crud composite (list + editing draft + writes). `strategy` picks the fetch (default `paginate`). */
	many: <O extends FF_RepoOptions<Entity>, S extends ManyStrategy = 'paginate'>(
		opts: StrictGetter<Entity, O>,
		strategy?: S,
	) => FF_Many<Entity, S, O>
	/** A single reactive record bound to `item` - by primary key (`{ id }` -> findId) or filter (`{ where }` -> findFirst). */
	one: (opts: () => FF_OneOptions<Entity>) => FF_One<Entity>
	/** The entity's remult metadata (captions, permissions, fields). */
	readonly meta: EntityMetadata<Entity>
}

/**
 * `ff(E)` - the firstly reactive layer. `ff(E).many(getter, strategy?)` for a list+edit
 * composite, `ff(E).one(getter)` for a single record. Everything imperative stays on
 * remult's `repo(E)`.
 */
export function ff<Entity>(entity: ClassType<Entity>): FF_Builder<Entity> {
	const r = remultRepo(entity)
	return {
		many<O extends FF_RepoOptions<Entity>, S extends ManyStrategy = 'paginate'>(
			o: StrictGetter<Entity, O>,
			strategy?: S,
		) {
			return new FF_ManyHandle(
				r,
				o as Getter<Entity, O>,
				strategy ?? 'paginate',
			) as unknown as FF_Many<Entity, S, O>
		},
		one(o: () => FF_OneOptions<Entity>) {
			return new FF_RepoHandle(
				r,
				o as unknown as Getter<Entity, FF_RepoOptions<Entity>>,
				'one',
			) as unknown as FF_One<Entity>
		},
		get meta() {
			return r.metadata
		},
	}
}
