<script lang="ts" generics="T extends object">
	// Boutique grid shell — copy into your app and make it yours. Opinionated: read + header-sort
	// + paginate, with create/edit/delete in a dialog (reusing the shared GroupFields form),
	// icon buttons, and permission-driven disabling. Composes the published primitives.
	import { untrack } from 'svelte'

	import type { ClassType, EntityFilter, EntityOrderBy } from 'remult'

	import {
		buildCells,
		type CellInput,
		displayCell,
		type DialogClose,
		ff,
		FF_Config,
		ffConfig,
		type FF_Many,
		Icon,
		LibIcon_Add,
		LibIcon_Edit,
		type ManyStrategy,
	} from 'firstly/svelte'

	import GroupFields from './GroupFields.svelte'

	type Props = {
		entity: ClassType<T>
		/** Columns shown in the table (and the default for the create/edit forms). */
		selected?: CellInput<T>[]
		/** Fields in the create form — name exactly what's settable on a new row. Defaults to `selected`. */
		createFields?: CellInput<T>[]
		/** Fields in the edit form. Defaults to `selected`. */
		editFields?: CellInput<T>[]
		where?: EntityFilter<T>
		orderBy?: EntityOrderBy<T>
		strategy?: ManyStrategy
		pageSize?: number
		enabled?: boolean
		/** Pure read-only — hide the create/edit/delete dialog entirely. */
		readonly?: boolean
		/** Placeholder rows shown during the first load (kept the same height to avoid a shift). */
		skeletonRows?: number
	}
	let {
		entity,
		selected,
		createFields,
		editFields,
		where,
		orderBy,
		strategy = 'paginate',
		pageSize = 25,
		enabled = true,
		readonly = false,
		skeletonRows = 2,
	}: Props = $props()

	let sort = $state<EntityOrderBy<T> | undefined>(orderBy)

	const m = untrack(() =>
		ff(entity).many(() => ({ where, orderBy: sort, pageSize, enabled }), strategy),
	) as unknown as FF_Many<T, 'paginate'>

	const cells = $derived(buildCells(m.meta, selected))
	const editable = $derived(!readonly)
	const count = $derived(m.aggregates?.$count ?? m.items.length)

	// Capture the app's cell config HERE (this component is under the app's <FF_Config>). The edit
	// dialog is portaled to the app root by FF_DialogManager — outside <FF_Config> — so we re-provide
	// the captured config inside the dialog, else the registered inputs wouldn't resolve.
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
	// Track create vs edit explicitly — inferring from the draft's id breaks for composite PKs
	// (an all-empty new row's getId is "," → truthy).
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
		{@const editing = !creating}
		<FF_Config cell={cfg.cell}>
			<GroupFields
				meta={m.meta}
				{draft}
				selected={editing ? (editFields ?? selected) : (createFields ?? selected)}
				mode="edit"
			{errors}
			error={saveError}
			busy={m.isWriting}
			saveLabel={editing ? 'Save' : 'Create'}
			canSave={editing ? m.meta.apiUpdateAllowed(draft) : m.meta.apiInsertAllowed()}
			onsave={async () => {
				try {
					await m.save()
					errors = {}
					saveError = ''
					close({ ok: true })
				} catch (err) {
					const ms = (err as { modelState?: Record<string, string> })?.modelState
					errors = ms ?? {}
					saveError = ms ? '' : err instanceof Error ? err.message : String(err)
				}
			}}
			ondelete={editing
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
		{#if editable}
			<button data-ff-grid-new title="New" disabled={!m.meta.apiInsertAllowed()} onclick={openCreate}>
				<Icon size="1.05rem" data={LibIcon_Add} />
			</button>
		{/if}
		<span data-ff-grid-count>{count}</span>
	</div>
	{#if m.error && !m.draft}<p data-ff-grid-error>{m.error}</p>{/if}
	<table>
		<thead>
			<tr>
				{#each cells as cell, i (cell.col ?? `${cell.kind}-${i}`)}
					<th
						data-col={cell.col}
						style:text-align={cell.align}
						class={cell.class}
						onclick={() => cell.col && cell.kind === 'field' && toggleSort(cell.col)}
					>
						{cell.caption}{#if cell.col && sortDir(cell.col)}<span data-sort
								>{sortDir(cell.col) === 'asc' ? ' ▲' : ' ▼'}</span
							>{/if}
					</th>
				{/each}
				{#if editable}<th></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#if m.loading.init}
				{#each Array(skeletonRows) as _, i (i)}
					<tr
						>{#each cells as cell, i (cell.col ?? `${cell.kind}-${i}`)}<td><span data-sk></span></td
							>{/each}{#if editable}<td data-ff-grid-actions><span data-sk data-sk-btn></span></td>{/if}</tr
					>
				{/each}
			{:else}
				{#each m.items as row (idOf(row))}
					<tr>
						{#each cells as cell, i (cell.col ?? `${cell.kind}-${i}`)}
							<td data-col={cell.col} style:text-align={cell.align} class={cell.class}>
								{#if cell.cellSnippet}{@render cell.cellSnippet({
										row,
										cell,
									})}{:else if cell.kind === 'field_link' && cell.field?.options.href}<a
										data-ff-link
										href={cell.field.options.href(row)}>{displayCell(cell, row)}</a
									>{:else}{displayCell(cell, row)}{/if}
							</td>
						{/each}
						{#if editable}
							<td data-ff-grid-actions>
								<button
									data-ff-grid-edit
									title="Edit"
									disabled={!m.meta.apiUpdateAllowed(row)}
									onclick={() => openEdit(row)}
								>
									<Icon size="1.05rem" data={LibIcon_Edit} />
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
