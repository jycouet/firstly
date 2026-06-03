<script lang="ts" generics="T extends object">
	import { untrack } from 'svelte'

	import type { ClassType, EntityFilter, EntityOrderBy } from 'remult'

	import { ff, type FF_Many, type ManyStrategy } from '../ff.svelte.js'
	import { buildCells, displayCell } from './buildCells.js'
	import type { CellInput } from './cellTypes.js'

	type Props = {
		entity: ClassType<T>
		selected?: CellInput<T>[]
		where?: EntityFilter<T>
		orderBy?: EntityOrderBy<T>
		strategy?: ManyStrategy
		pageSize?: number
		enabled?: boolean
		/** Hide the trailing delete column even when allowed. */
		hideDelete?: boolean
	}
	let {
		entity,
		selected,
		where,
		orderBy,
		strategy = 'paginate',
		pageSize = 25,
		enabled = true,
		hideDelete = false,
	}: Props = $props()

	let sort = $state<EntityOrderBy<T> | undefined>(orderBy)

	const m = untrack(() =>
		ff(entity).many(() => ({ where, orderBy: sort, pageSize, enabled }), strategy),
	) as unknown as FF_Many<T, 'paginate'>

	const cells = $derived(buildCells(m.meta, selected))
	const showDelete = $derived(!hideDelete && m.meta.apiDeleteAllowed())

	function toggleSort(key: string) {
		const cur = (sort as Record<string, 'asc' | 'desc'> | undefined)?.[key]
		sort = { [key]: cur === 'asc' ? 'desc' : 'asc' } as EntityOrderBy<T>
	}
	const sortDir = (key: string) => (sort as Record<string, string> | undefined)?.[key]

	// Key rows by the entity's real id (string, number, or composite) - not a `.id` field,
	// so composite-PK entities work too.
	const rowKey = (row: T) => m.meta.idMetadata.getId(row)
</script>

<div data-ff-grid>
	{#if m.error}<p data-ff-grid-error>{m.error}</p>{/if}
	<table>
		<thead>
			<tr>
				{#each cells as cell (cell.col ?? cell.kind)}
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
				{#if showDelete}<th></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#if m.loading.init}
				{#each Array(2) as _, i (i)}
					<tr
						>{#each cells as cell (cell.col ?? cell.kind)}<td><span data-sk></span></td
							>{/each}{#if showDelete}<td></td>{/if}</tr
					>
				{/each}
			{:else}
				{#each m.items as row (rowKey(row))}
					<tr>
						{#each cells as cell (cell.col ?? cell.kind)}
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
						{#if showDelete}
							<td>
								<button
									data-ff-grid-del
									disabled={!m.meta.apiDeleteAllowed(row)}
									onclick={() => m.confirmRemove(row)}
								>
									Delete
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	{#if strategy === 'paginate' && m.aggregates}<span data-ff-grid-count>{m.aggregates.$count}</span
		>{/if}
	{#if strategy === 'paginate' && m.hasNextPage}
		<button data-ff-grid-more disabled={m.loading.more} onclick={() => m.more()}>More</button>
	{/if}
	{#if !m.loading.init && m.items.length === 0}<p data-ff-grid-empty>Nothing yet.</p>{/if}
</div>
