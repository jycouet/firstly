<script lang="ts" generics="T extends object">
	// Boutique grid shell — copy into your app and make it yours. Opinionated: read + header-sort
	// + paginate, with create/edit/delete in a dialog (reusing the shared GroupFields form). Reads the
	// entity's `hub` config as DEFAULTS; every prop overrides it. Composes the published primitives
	// (buildCells / FF_CellValue / FF_Cell). Renders cell values — incl. the component+props escape —
	// via the published <FF_CellValue>, so an app's own App_Grid gets the exact same behaviour.
	import { untrack } from 'svelte'

	import { repo } from 'remult'
	import type { ClassType, EntityFilter, EntityOrderBy } from 'remult'
	import {
		buildCells,
		errorMessage,
		ff,
		FF_CellValue,
		FF_Config,
		ffConfig,
		Icon,
		LibIcon_Add,
		LibIcon_Edit,
		type ActionConfig,
		type CellInput,
		type DialogClose,
		type FF_Many,
		type HubConfig,
		type ManyStrategy,
	} from 'firstly/svelte'

	import GroupFields from './GroupFields.svelte'

	type Props = {
		entity: ClassType<T>
		/** Grid columns + the default fields for the create/edit forms. Defaults to the entity hub. */
		cells?: CellInput<T>[]
		where?: EntityFilter<T>
		orderBy?: EntityOrderBy<T>
		strategy?: ManyStrategy
		pageSize?: number
		enabled?: boolean
		/** Pure read-only — disable create/edit/delete entirely. */
		readonly?: boolean
		/** Create action ({} on, false off). Defaults to the hub, then on. */
		insert?: ActionConfig<T> | false
		/** Edit action. */
		update?: ActionConfig<T> | false
		/** Delete action. */
		delete?: ActionConfig<T> | false
		/** Placeholder rows shown during the first load (kept the same height to avoid a shift). */
		skeletonRows?: number
	}
	let {
		entity,
		cells,
		where,
		orderBy,
		strategy: strategyProp,
		pageSize: pageSizeProp,
		enabled = true,
		readonly = false,
		insert,
		update,
		delete: deleteProp,
		skeletonRows = 2,
	}: Props = $props()

	// Entity hub = the SSoT defaults. Read it off metadata BEFORE building the handle (its getter needs
	// where/pageSize/strategy from the hub). meta.options carries the `hub` augmentation.
	const hub = untrack(() => (repo(entity).metadata.options.hub ?? {}) as HubConfig<T>)
	const strategy = untrack(() => strategyProp ?? hub.strategy ?? 'paginate')
	const pageSize = untrack(() => pageSizeProp ?? hub.pageSize ?? 25)

	let sort = $state<EntityOrderBy<T> | undefined>(untrack(() => orderBy ?? hub.orderBy))

	const m = untrack(() =>
		ff(entity).many(
			() => ({ where: where ?? hub.where, orderBy: sort, pageSize, enabled }),
			strategy,
		),
	) as unknown as FF_Many<T, 'paginate'>

	// list columns (input) + resolved Cell[] (cols)
	const listCells = $derived(cells ?? hub.cells)
	const cols = $derived(buildCells(m.meta, listCells))
	const count = $derived(m.aggregates?.$count ?? m.items.length)

	// actions: prop ?? hub ?? on; `false` (or readonly) disables. `false` short-circuits the ??.
	const insertCfg = $derived(readonly ? false : (insert ?? hub.insert ?? {}))
	const updateCfg = $derived(readonly ? false : (update ?? hub.update ?? {}))
	const deleteCfg = $derived(readonly ? false : (deleteProp ?? hub.delete ?? {}))
	const canCreate = $derived(insertCfg !== false)
	const canEdit = $derived(updateCfg !== false)
	const canDelete = $derived(deleteCfg !== false)
	const showRowActions = $derived(canEdit || canDelete)

	const newIcon = $derived(insertCfg !== false ? (insertCfg.icon ?? LibIcon_Add) : LibIcon_Add)
	const editIcon = $derived(updateCfg !== false ? (updateCfg.icon ?? LibIcon_Edit) : LibIcon_Edit)

	// Capture the app's cell config HERE (under the app's <FF_Config>). The dialog is portaled to the
	// app root — outside <FF_Config> — so we re-provide the captured config inside the dialog snippet.
	const cfg = ffConfig()

	function toggleSort(key: string) {
		const cur = (sort as Record<string, 'asc' | 'desc'> | undefined)?.[key]
		sort = { [key]: cur === 'asc' ? 'desc' : 'asc' } as EntityOrderBy<T>
	}
	const sortDir = (key: string) => (sort as Record<string, string> | undefined)?.[key]

	// Key rows by the entity's real id (string, number, or composite).
	const idOf = (row: T) => m.meta.idMetadata.getId(row)

	let errors = $state<Record<string, string | undefined>>({})
	let saveError = $state('')
	// Track create vs edit explicitly — a composite-PK new row's getId is "," (truthy), so the id
	// can't tell create from edit.
	let creating = $state(false)

	const openEdit = (row: T) => {
		creating = false
		errors = {}
		saveError = ''
		m.editInDialog(row, dialogBody)
	}
	const openCreate = () => {
		creating = true
		errors = {}
		saveError = ''
		m.createInDialog(dialogBody)
	}
</script>

{#snippet dialogBody(close: DialogClose)}
	{#if m.draft}
		{@const draft = m.draft}
		{@const action = creating ? insertCfg : updateCfg}
		{@const formCells = (action !== false && action.cells) || listCells}
		<FF_Config cell={cfg.cell}>
			<GroupFields
				meta={m.meta}
				{draft}
				cells={formCells}
				mode="edit"
				{errors}
				error={saveError}
				busy={m.isWriting}
				saveLabel={creating ? 'Create' : 'Save'}
				canSave={creating ? m.meta.apiInsertAllowed() : m.meta.apiUpdateAllowed(draft)}
				onsave={async () => {
					try {
						await m.save()
						errors = {}
						saveError = ''
						close({ ok: true })
					} catch (err) {
						const ms = (err as { modelState?: Record<string, string> })?.modelState
						errors = ms ?? {}
						// per-field errors show beside each field; form-level only for non-field errors
						saveError = ms ? '' : errorMessage(err)
					}
				}}
				ondelete={!creating && canDelete
					? async () => {
							const res = await m.confirmRemove(draft)
							if (res.ok) close({ ok: true })
						}
					: undefined}
			/>
		</FF_Config>
	{/if}
{/snippet}

<div data-ff-grid>
	<div data-ff-grid-toolbar>
		{#if canCreate}
			<button data-ff-grid-new title="New" disabled={!m.meta.apiInsertAllowed()} onclick={openCreate}>
				<Icon size="1.05rem" data={newIcon} />
			</button>
		{/if}
		<span data-ff-grid-count>{count}</span>
	</div>
	{#if m.error && !m.draft}<p data-ff-grid-error>{m.error}</p>{/if}
	<table>
		<thead>
			<tr>
				{#each cols as cell, i (cell.col ?? `${cell.kind}-${i}`)}
					<th
						data-col={cell.col}
						data-sortable={cell.sortable || undefined}
						style:text-align={cell.align}
						class={cell.class}
						onclick={() => cell.sortable && cell.col && toggleSort(cell.col)}
					>
						{cell.caption}{#if cell.col && sortDir(cell.col)}<span data-sort
								>{sortDir(cell.col) === 'asc' ? ' ▲' : ' ▼'}</span
							>{/if}
					</th>
				{/each}
				{#if showRowActions}<th></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#if m.loading.init}
				{#each Array(skeletonRows) as _, i (i)}
					<tr
						>{#each cols as cell, i (cell.col ?? `${cell.kind}-${i}`)}<td><span data-sk></span></td
							>{/each}{#if showRowActions}<td data-ff-grid-actions><span data-sk data-sk-btn></span></td
							>{/if}</tr
					>
				{/each}
			{:else}
				{#each m.items as row (idOf(row))}
					<tr>
						{#each cols as cell, i (cell.col ?? `${cell.kind}-${i}`)}
							<td data-col={cell.col} style:text-align={cell.align} class={cell.class}>
								<FF_CellValue {cell} {row} />
							</td>
						{/each}
						{#if showRowActions}
							<td data-ff-grid-actions>
								<button
									data-ff-grid-edit
									title="Edit"
									disabled={!m.meta.apiUpdateAllowed(row)}
									onclick={() => openEdit(row)}
								>
									<Icon size="1.05rem" data={editIcon} />
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	{#if strategy === 'paginate' && m.hasNextPage}
		<button data-ff-grid-more disabled={m.loading.more} onclick={() => m.more()}>More</button>
	{/if}
	{#if !m.loading.init && m.items.length === 0}<p data-ff-grid-empty>Nothing yet.</p>{/if}
</div>
