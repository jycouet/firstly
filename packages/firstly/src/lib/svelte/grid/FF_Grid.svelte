<script lang="ts" generics="T extends object">
	// PUBLISHED batteries-included grid — `import { FF_Grid } from 'firstly/svelte'` and go, zero setup:
	// it bundles a default input + a neutral default skin. Reads the entity `hub` (every prop overrides).
	// For full control over markup + look, copy the boutique <App_Grid> instead (degit src/boutique/grid).
	import { untrack } from 'svelte'

	import { repo } from 'remult'
	import type { ClassType, EntityFilter, EntityOrderBy } from 'remult'

	import { errorMessage } from '../../core/helper.js'
	import FF_Config from '../FF_Config.svelte'
	import { ffConfig } from '../FF_Config.svelte.js'
	import { ff } from '../ff.svelte.js'
	import type { FF_Many, ManyStrategy } from '../ff.svelte.js'
	import type { DialogClose } from '../dialog.svelte.js'
	import Icon from '../ui/Icon.svelte'
	import { LibIcon_Add, LibIcon_Edit } from '../ui/LibIcon.js'
	import { buildCells } from './buildCells.js'
	import type { ActionConfig, CellInput, HubConfig } from './cellTypes.js'
	import DefaultInput from './DefaultInput.svelte'
	import FF_CellValue from './FF_CellValue.svelte'
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

	const hub = untrack(() => (repo(entity).metadata.options.hub ?? {}) as HubConfig<T>)
	const strategy = untrack(() => strategyProp ?? hub.strategy ?? 'paginate')
	const pageSize = untrack(() => pageSizeProp ?? hub.pageSize ?? 25)

	let sort = $state<EntityOrderBy<T> | undefined>(untrack(() => orderBy ?? hub.orderBy))

	const m = untrack(() =>
		ff(entity).many(() => ({ where: where ?? hub.where, orderBy: sort, pageSize, enabled }), strategy),
	) as unknown as FF_Many<T, 'paginate'>

	const cfg = ffConfig()
	const defaultSortable = $derived(hub.defaultSortable ?? cfg.cell?.defaultSortable)

	// the dialog is portaled outside <FF_Config>; re-provide the captured config, but BUNDLE default
	// inputs so a zero-setup app still gets working form fields (its own inputs override).
	const dialogCellConfig = $derived({
		...cfg.cell,
		inputs: {
			text: DefaultInput,
			number: DefaultInput,
			checkbox: DefaultInput,
			...cfg.cell?.inputs,
		},
	})

	const listCells = $derived(cells ?? hub.cells)
	const cols = $derived(buildCells(m.meta, listCells, { defaultSortable }))
	const count = $derived(m.aggregates?.$count ?? m.items.length)

	const insertCfg = $derived(readonly ? false : (insert ?? hub.insert ?? {}))
	const updateCfg = $derived(readonly ? false : (update ?? hub.update ?? {}))
	const deleteCfg = $derived(readonly ? false : (deleteProp ?? hub.delete ?? {}))
	const canCreate = $derived(insertCfg !== false)
	const canEdit = $derived(updateCfg !== false)
	const canDelete = $derived(deleteCfg !== false)
	const showRowActions = $derived(canEdit || canDelete)

	const newIcon = $derived(insertCfg !== false ? (insertCfg.icon ?? LibIcon_Add) : LibIcon_Add)
	const editIcon = $derived(updateCfg !== false ? (updateCfg.icon ?? LibIcon_Edit) : LibIcon_Edit)

	function toggleSort(key: string) {
		const cur = (sort as Record<string, 'asc' | 'desc'> | undefined)?.[key]
		sort = { [key]: cur === 'asc' ? 'desc' : 'asc' } as EntityOrderBy<T>
	}
	const sortDir = (key: string) => (sort as Record<string, string> | undefined)?.[key]

	const idOf = (row: T) => m.meta.idMetadata.getId(row)

	let errors = $state<Record<string, string | undefined>>({})
	let saveError = $state('')
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
		<FF_Config cell={dialogCellConfig}>
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

<style>
	/* default skin bundled with the published FF_Grid. :global reaches the portaled dialog. */
	:global([data-ff-grid] table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}
	:global([data-ff-grid] :is(th, td)) {
		padding: 6px 9px;
		border-bottom: 1px solid color-mix(in srgb, currentColor 13%, transparent);
		text-align: left;
		white-space: nowrap;
	}
	:global([data-ff-grid] th:first-child),
	:global([data-ff-grid] td:first-child) {
		width: 100%;
	}
	:global([data-ff-grid] th) {
		font-weight: 600;
		user-select: none;
	}
	:global([data-ff-grid] th[data-sortable]) {
		cursor: pointer;
	}
	:global([data-ff-grid] tbody tr:hover) {
		background: color-mix(in srgb, currentColor 6%, transparent);
	}
	:global([data-ff-grid-toolbar]) {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}
	:global([data-ff-grid-count]) {
		margin-left: auto;
		font-size: 15px;
		opacity: 0.75;
		font-variant-numeric: tabular-nums;
	}
	:global([data-ff-grid-empty]) {
		opacity: 0.6;
		font-size: 14px;
		padding: 8px 0;
	}
	:global([data-ff-grid-actions]) {
		text-align: right;
	}
	:global([data-ff-grid] button) {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font: inherit;
		cursor: pointer;
		padding: 5px 9px;
		color: inherit;
		background: color-mix(in srgb, currentColor 8%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 7px;
	}
	:global([data-ff-grid] button:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
	:global([data-ff-grid] [data-ff-grid-edit]),
	:global([data-ff-grid] [data-ff-grid-new]) {
		background: transparent;
		border-color: transparent;
		padding: 3px 5px;
		opacity: 0.6;
	}
	:global([data-ff-grid] [data-ff-grid-edit]:hover),
	:global([data-ff-grid] [data-ff-grid-new]:hover) {
		background: color-mix(in srgb, currentColor 12%, transparent);
		opacity: 1;
	}
	:global([data-ff-grid] [data-ff-grid-more]) {
		display: flex;
		margin: 12px auto 0;
	}
	:global([data-ff-grid] [data-sk]) {
		display: inline-block;
		width: 70%;
		height: 1.05em;
		border-radius: 4px;
		background: color-mix(in srgb, currentColor 14%, transparent);
		animation: -global-ff-sk 1.2s ease-in-out infinite;
	}
	:global([data-ff-grid] [data-sk-btn]) {
		width: 1.4em;
	}
	@keyframes -global-ff-sk {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.85;
		}
	}
	/* dialog form (portaled) */
	:global([data-ff-form]),
	:global([data-ff-group]) {
		display: block;
		min-width: 280px;
	}
	:global([data-ff-form] button) {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font: inherit;
		cursor: pointer;
		padding: 5px 11px;
		color: inherit;
		background: color-mix(in srgb, currentColor 8%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 7px;
	}
	:global([data-ff-form-actions]) {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		margin-top: 8px;
	}
	:global([data-ff-form-actions] [data-primary]) {
		margin-left: auto;
		font-weight: 600;
	}
	:global([data-ff-form-actions] [data-danger]) {
		color: var(--color-error, #dc2626);
		border-color: color-mix(in srgb, var(--color-error, #dc2626) 45%, transparent);
	}
	:global([data-ff-readonly]) {
		display: block;
		box-sizing: border-box;
		padding: 5px 8px;
	}
	:global([data-ff-form-error]) {
		color: var(--color-error, #dc2626);
		font-size: 13px;
		margin: 4px 0 0;
	}
	:global([data-ff-cell-error]) {
		color: var(--color-error, #dc2626);
		font-size: 12px;
	}
</style>
