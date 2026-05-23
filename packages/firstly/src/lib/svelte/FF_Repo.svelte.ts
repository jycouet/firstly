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

/**
 * `ffRepo` - thin reactive wrapper around a Remult `repo`, exposing its results as
 * Svelte runes. Pick the mode with a verb:
 *
 *   ffRepo(E).load(() => ({ where }))       // load  - one-shot list + refresh()
 *   ffRepo(E).listen(() => ({ where }))     // live  - liveQuery, auto-updates
 *   ffRepo(E).paginate(() => ({ where }))   // paginate - more() / hasNextPage / aggregates
 *   ffRepo(E).one(() => ({ where }))        // one   - reactive single record in `item`
 *
 * Two surfaces, one rule: anything NOT under `.repo` is reactive (a verb returns a
 * runes handle; that handle's writes sync its own state). Anything under `.repo` is
 * the plain remult repo - imperative, returns Promises, touches no runes state.
 *
 * The options getter is reactive: change `where` (e.g. a search box), `orderBy`,
 * `enabled`, etc. and the query re-runs - `listen` re-subscribes (the old
 * subscription is torn down), `load`/`paginate`/`one` re-fetch and ignore any
 * stale in-flight response. `orderBy` defaults to the entity's `defaultOrderBy`.
 *
 * Getter hygiene: read SvelteKit load `data` through a `$derived`
 * (`const did = $derived(data.targetDid)`), never raw inside the getter. A derived
 * only propagates on value change, so a parent layout load revalidating - e.g. an
 * SP URL write re-running url-dependent loads on every filter - hands you a new
 * `data` object but does NOT re-fetch unless the value actually changed; a real
 * change (route param switch) still does. Reading `data.x` raw re-fetches on every
 * revalidation (a duplicate request per filter).
 *
 * `enabled: false` skips the query entirely (keeps the last result) and runs it
 * the moment it flips true - use it for search-min-length, tab visibility,
 * dependent queries, or a manual button trigger.
 *
 * Writes: only the record handle (`one` / `create()`) writes - argless `save()` / `delete()`
 * act on its `item` and re-sync it. List handles (`load` / `listen` / `paginate`) don't write;
 * go through `.repo` (the plain remult repo: `insert` / `update` / `save` / `delete` /
 * `deleteMany`), then reflect it in a `load` / `paginate` list with the local reconcilers
 * (`addItem` / `updateItem` / `removeItem`) - a `listen` list re-syncs itself via the liveQuery.
 * A failed write fills `error` and re-throws.
 *
 * The factory's return type is mode-specific, so e.g. `.more()` doesn't exist on
 * a `listen()` handle. Methods also throw if reached via a cast in the wrong mode.
 *
 * Reactive vs imperative: the reactive verbs take a *getter* (`() => ({ ... })`) and
 * return a runes handle; they build an `$effect`, so they must be created during
 * component init. For a one-off read/write in a click handler / async fn (no runes
 * context) go through `.repo` (plain remult): `ffRepo(E).repo.findFirst(where)`,
 * `ffRepo(E).repo.findId(id)`, `ffRepo(E).repo.find(...)`.
 *
 * Tip: prefer `.paginate()` whenever you want a total - it returns `aggregates.$count`
 * for free in the same request. `load`/`listen`/`one` don't count; for a one-off count
 * use `ffRepo(E).repo.count(where)`.
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
 * that build query options outside `ffRepo` (e.g. a generic table component).
 */
export type QueryOptionsHelper<Entity> = QueryOptions<Entity> & {
	aggregate?: AggregateOptions<Entity>
}

export type FF_RepoOptions<Entity> = {
	where?: EntityFilter<Entity>
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

type Mode = 'live' | 'load' | 'paginate' | 'one'

/**
 * The reactive handle implementation. Not exported directly - consumers use a per-mode
 * alias (`FF_RepoLoad`/`FF_RepoLive`/`FF_RepoPaginate`/`FF_RepoOne`) or the umbrella
 * union `FF_Repo` (any mode). Each verb returns the Omit'd per-mode view of this.
 */
class FF_RepoHandle<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> {
	#repo: Repository<Entity>
	#opts: Getter<Entity, O>
	#mode: Mode
	#defaultOrderBy?: EntityOrderBy<Entity>
	#paginator?: Paginator<Entity>
	#seq = 0

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
						},
						error: (e) => {
							this.error = e instanceof Error ? e.message : String(e)
							this.loading.init = false
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
			} else if (this.#mode === 'one') {
				const found = await this.#repo.findFirst(o.where, {
					orderBy: o.orderBy,
					include: o.include,
				})
				if (seq !== this.#seq) return
				this.item = found ?? undefined
				this.items = found ? [found] : []
			} else {
				const items = await this.#repo.find({
					where: o.where,
					orderBy: o.orderBy,
					limit: o.limit,
					include: o.include,
				})
				if (seq !== this.#seq) return
				this.items = items
			}
		} catch (e) {
			if (seq === this.#seq) this.error = e instanceof Error ? e.message : String(e)
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
		this.loading.more = true
		try {
			const next = await this.#paginator.nextPage()
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
	 * const list = ffRepo(Plan).listen(() => ({ where: { ownerDid } }))
	 * let draft = $state({ title: '' })
	 * list.onFirst((latest) => (draft.title = latest.title)) // seed once, then edit freely
	 * ```
	 */
	onFirst(fn: (latest: Entity) => void) {
		let done = false
		$effect(() => {
			if (done) return
			const latest = this.items[0]
			if (latest == null) return
			fn(latest)
			done = true
		})
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
		}
	}

	/** Save the current `item` (from `one` / `create()`). To save a specific row, use `.repo.save(row)`. */
	save() {
		return this.#write(
			'saving',
			() => this.#repo.save(this.#requireItem()),
			() => this.#resync(),
		)
	}

	/** Delete the current `item`. To delete a specific row/id, use `.repo.delete(idOrRow)`. */
	delete() {
		const target = this.#requireItem()
		return this.#write(
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
	}

	/** The current `item` (or throw) - backs the argless `save()`/`delete()`. */
	#requireItem(): Entity {
		if (this.item === undefined)
			throw new Error(
				'FF_Repo: no `item` to save/delete - load one first (`one` mode or `create()`), or write a specific row through `.repo`.',
			)
		return this.item
	}

	// Client-side list reconcilers (no server I/O) - reflect a change you made
	// elsewhere (e.g. via `.repo`) in the reactive `items`. `load`/`paginate` only;
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
		this.#removeLocal(idOrItem)
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

/** load: one-shot list (`refresh()` to re-run) - a read+reconcile view. No paging/aggregates, and no `item`/`save`/`delete`/`create` (edit via `one`, write via `.repo`). */
export type FF_RepoLoad<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoHandle<Entity, O>,
	'more' | 'hasNextPage' | 'aggregates' | 'item' | 'save' | 'delete' | 'create'
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
>
/** paginate: `more()` / `hasNextPage` / `aggregates` - a read+reconcile view. No `onFirst` (paged ≠ latest), and no `item`/`save`/`delete`/`create`. */
export type FF_RepoPaginate<
	Entity,
	O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>,
> = Omit<FF_RepoHandle<Entity, O>, 'onFirst' | 'item' | 'save' | 'delete' | 'create'>
/** one: a single reactive record in `item`. No paging / aggregates / list reconcilers. */
export type FF_RepoOne<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> = Omit<
	FF_RepoHandle<Entity, O>,
	'more' | 'hasNextPage' | 'aggregates' | 'addItem' | 'updateItem' | 'removeItem'
>

/**
 * Umbrella handle type - any mode. Use for a component prop that accepts a
 * `load`/`listen`/`paginate`/`one` handle (`r: FF_Repo<T>`). It exposes the surface
 * common to every mode (`items`/`loading`/`error`/`meta`/`repo`); mode-specific members
 * (`item`/`save`/`delete`/`create` on `one`; `more`/`hasNextPage`/`aggregates`/`refresh`/
 * `onFirst`/`addItem`/`updateItem`/`removeItem`) require the matching per-mode type.
 */
export type FF_Repo<Entity, O extends FF_RepoOptions<Entity> = FF_RepoOptions<Entity>> =
	| FF_RepoLoad<Entity, O>
	| FF_RepoLive<Entity, O>
	| FF_RepoPaginate<Entity, O>
	| FF_RepoOne<Entity, O>

// A thunk skips TS's excess-property check on its returned object literal (the
// return type is inferred, then assignability-checked, which allows extra keys).
// Intersecting with `never` on the extra keys forces unknown top-level keys (typos)
// to error. NOTE: this only guards the option keys; a bogus field *inside*
// where/orderBy follows remult's own (looser) EntityFilter/EntityOrderBy types.
type StrictGetter<Entity, O extends FF_RepoOptions<Entity>> = () => O &
	Record<Exclude<keyof O, keyof FF_RepoOptions<Entity>>, never>

/**
 * The builder returned by `ffRepo(E)`. Two surfaces only: the reactive verbs
 * (`load`/`listen`/`paginate`/`one`), and `.repo` - the plain remult repo for every
 * imperative read/write (`findFirst`, `findId`, `find`, `insert`, `update`, `save`,
 * `delete`, `count`, `upsert`, ...). `.meta` is a shortcut to `repo.metadata`.
 */
export type FF_RepoBuilder<Entity> = {
	load: <O extends FF_RepoOptions<Entity>>(opts: StrictGetter<Entity, O>) => FF_RepoLoad<Entity, O>
	listen: <O extends FF_RepoOptions<Entity>>(opts: StrictGetter<Entity, O>) => FF_RepoLive<Entity, O>
	paginate: <O extends FF_RepoOptions<Entity>>(
		opts: StrictGetter<Entity, O>,
	) => FF_RepoPaginate<Entity, O>
	one: <O extends FF_RepoOptions<Entity>>(opts: StrictGetter<Entity, O>) => FF_RepoOne<Entity, O>
	/** The entity's remult metadata (permissions, fields, key). Shortcut to `repo.metadata`. */
	readonly meta: EntityMetadata<Entity>
	/** The underlying remult repo - every imperative read/write lives here. */
	readonly repo: Repository<Entity>
}

export function ffRepo<Entity>(entity: ClassType<Entity>): FF_RepoBuilder<Entity> {
	const r = remultRepo(entity)
	const builder: FF_RepoBuilder<Entity> = {
		load<O extends FF_RepoOptions<Entity>>(o: StrictGetter<Entity, O>) {
			return new FF_RepoHandle(r, o as Getter<Entity, O>, 'load') as FF_RepoLoad<Entity, O>
		},
		listen<O extends FF_RepoOptions<Entity>>(o: StrictGetter<Entity, O>) {
			return new FF_RepoHandle(r, o as Getter<Entity, O>, 'live') as FF_RepoLive<Entity, O>
		},
		paginate<O extends FF_RepoOptions<Entity>>(o: StrictGetter<Entity, O>) {
			return new FF_RepoHandle(r, o as Getter<Entity, O>, 'paginate') as FF_RepoPaginate<Entity, O>
		},
		one<O extends FF_RepoOptions<Entity>>(o: StrictGetter<Entity, O>) {
			return new FF_RepoHandle(r, o as Getter<Entity, O>, 'one') as FF_RepoOne<Entity, O>
		},
		get meta() {
			return r.metadata
		},
		repo: r,
	}
	return builder
}
