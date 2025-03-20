<script lang="ts" generics="entityType = unknown">
	import { type FieldMetadata } from 'remult'

	import type { FF_Repo } from './FF_Repo.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import { LibIcon_Delete, LibIcon_Edit } from '$lib/ui/LibIcon'

	interface Props<entityType> {
		uid?: string
		r: FF_Repo<entityType>
		fields?: FieldMetadata<unknown, entityType>[]
		showActions?: boolean
		onedit?: (item: entityType) => void
		ondelete?: (item: entityType) => void

		classes?: {
			root?: string
			actions?: string
			actionButton?: string
		}
	}

	let {
		r,
		fields = r.fields.toArray().filter((c) => c.apiUpdateAllowed()),
		showActions = true,
		onedit,
		ondelete,
		classes = {
			root: 'table',
			actions: 'flex gap-2 justify-end',
			actionButton: 'px-2 py-1 text-xs',
		},
	}: Props<entityType> = $props()
</script>

{#if r.aggregates?.$count}
	<div class="text-right">
		Total: {r.aggregates?.$count}
	</div>
{/if}
<table data-ff-grid class={classes?.root}>
	<thead>
		<tr data-ff-grid-header>
			{#each fields ?? [] as item (item.key)}
				<th data-ff-grid-header-cell>{item.caption}</th>
			{/each}
			{#if showActions}
				<th data-ff-grid-header-cell>Actions</th>
			{/if}
		</tr>
	</thead>
	<tbody>
		{#if r.loading.init}
			{#each Array(10) as _}
				<tr>
					{#each fields ?? [] as item (item.key)}
						<td class="cell-loading"></td>
					{/each}
					{#if showActions}
						<td class="cell-loading"></td>
					{/if}
				</tr>
			{/each}
		{/if}
		{#if r.globalError}
			<tr>
				<td colspan={showActions ? fields.length + 1 : fields.length} class="text-danger">{r.globalError}</td>
			</tr>
		{/if}
		{#each r.items ?? [] as item (r.metadata.idMetadata.getId(item))}
			<tr data-ff-grid-row>
				{#each fields as f (f.key)}
					<td data-ff-grid-row-cell>{f.displayValue(item as Partial<entityType>)}</td>
				{/each}
				{#if showActions}
					<td data-ff-grid-actions-cell>
						<div class={classes?.actions}>
							{#if onedit}
								<button 
									disabled={!r.metadata.apiUpdateAllowed(item)}
									class={classes?.actionButton} 
									data-ff-grid-action-edit
									onclick={() => onedit(item)}
								>
									<Icon data={LibIcon_Edit} />
								</button>
							{/if}
							{#if ondelete}
								<button 
									disabled={!r.metadata.apiDeleteAllowed(item)}
									class={classes?.actionButton} 
									data-ff-grid-action-delete 
									onclick={() => ondelete(item)}
								>
									<Icon data={LibIcon_Delete} />
								</button>
							{/if}
						</div>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>
{#if r.hasNextPage}
	<div class="text-right">
		<button onclick={() => r.queryMore()}>Load More</button>
	</div>
{/if}

<style>
	.text-danger {
		color: red;
		text-align: center;
		padding-top: 2rem;
	}
	.cell-loading {
		width: 100%;
		height: 1.5rem;
		position: relative;
		overflow: hidden;
	}

	.cell-loading::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		transform: translateX(-100%);
		background-image: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0,
			rgba(255, 255, 255, 0.2) 20%,
			rgba(255, 255, 255, 0.5) 60%,
			rgba(255, 255, 255, 0)
		);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		100% {
			transform: translateX(100%);
		}
	}
</style>
