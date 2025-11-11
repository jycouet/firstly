<script lang="ts" generics="entityType = unknown">
	import { getEntityRef, type FieldMetadata } from 'remult'

	import Icon from '../ui/Icon.svelte'
	import { LibIcon_Add, LibIcon_Delete, LibIcon_Edit } from '../ui/LibIcon'
	import { dialog, FF_Cell_Display, FF_Repo, getClasses, type GridTheme } from './'

	interface Props<entityType> {
		// uid?: string
		r: FF_Repo<entityType>
		fields?: FieldMetadata<unknown, entityType>[]
		showCreate?: boolean
		showEdit?: boolean
		showDelete?: boolean
		oncreate?: () => void
		onedit?: (item: entityType) => void
		ondelete?: (item: entityType) => void

		classes?: GridTheme
	}

	let {
		r,
		fields = r.getLayout()?.groups?.[0]?.fields ?? [],
		showCreate = true,
		showEdit = true,
		showDelete = true,
		oncreate,
		onedit,
		ondelete,
		classes: localClasses = {},
	}: Props<entityType> = $props()

	let classes = $derived(getClasses('grid', localClasses))

	const showActions = $derived(showEdit || showDelete)
</script>

<div class="flex justify-end gap-2">
	{#if r.aggregates?.$count}
		Total: {r.aggregates?.$count}
	{/if}

	{#if showCreate}
		<button
			disabled={!r.metadata.apiInsertAllowed()}
			class="create-button"
			data-ff-grid-action-create
			onclick={async () => {
				if (oncreate) {
					oncreate()
				} else {
					const res = await dialog.fform(r, { defaults: {} })
					// Done already in FF_Form
					// if (res.success && r.items) {
					// 	r.items.unshift(res.item)
					// }
				}
			}}
		>
			<Icon data={LibIcon_Add} />
		</button>
	{/if}
</div>

<table data-ff-grid class={classes?.root}>
	<thead>
		<tr data-ff-grid-header class={classes?.header}>
			{#each fields ?? [] as item (item.key)}
				<th data-ff-grid-header-cell class="{classes?.headerCell} th-{item.inputType}"
					>{item.caption}</th
				>
			{/each}
			{#if showActions}
				<th data-ff-grid-header-cell class={classes?.actionsHeader} style="width: 1rem;"> Actions </th>
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
				<td colspan={showActions ? fields.length + 1 : fields.length} class="text-danger"
					>{r.globalError}</td
				>
			</tr>
		{/if}
		{#each r.items ?? [] as item (r.metadata.idMetadata.getId(item))}
			<tr data-ff-grid-row class={classes?.row}>
				{#each fields as f (f.key)}
					<td data-ff-grid-row-cell class="{classes?.rowCell} td-{f.inputType}">
						<FF_Cell_Display field={f} value={item[f.key as keyof entityType]}></FF_Cell_Display>
					</td>
				{/each}
				{#if showActions}
					<td data-ff-grid-actions-cell class={classes?.actionsColumn}>
						<div class={classes?.actions}>
							{#if showEdit}
								<button
									disabled={!r.metadata.apiUpdateAllowed(item)}
									class={classes?.actionButton}
									data-ff-grid-action-edit
									onclick={async () => {
										if (onedit) {
											onedit?.(item)
										} else {
											const ref = getEntityRef(item)
											const newR = new FF_Repo(r.ent, { item: ref.clone() })
											const res = await dialog.fform(newR, {})
											if (res.success) {
												if (r.items) {
													r.items[
														r.items.findIndex(
															(i) => r.metadata.idMetadata.getId(i) === r.metadata.idMetadata.getId(res.item),
														)
													] = res.item
												}
											}
										}
									}}
								>
									<Icon data={LibIcon_Edit} />
								</button>
							{/if}
							{#if showDelete}
								<button
									disabled={!r.metadata.apiDeleteAllowed(item)}
									class={classes?.actionButton}
									data-ff-grid-action-delete
									onclick={async () => {
										if (ondelete) {
											ondelete?.(item)
										} else {
											const res = await dialog.confirmDelete('')
											if (res.success) {
												await r.delete(item)
											}
										}
									}}
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
		<button class={classes?.loadMoreButton} onclick={() => r.queryMore()}>Load More</button>
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

	[data-ff-grid-action-create] {
		opacity: 1;
		color: inherit;
	}

	[data-ff-grid-action-create]:disabled {
		opacity: 0.5;
	}

	[data-ff-grid-action-edit] {
		opacity: 1;
		color: inherit;
	}

	[data-ff-grid-action-edit]:disabled {
		opacity: 0.5;
	}

	[data-ff-grid-action-delete] {
		opacity: 1;
		color: inherit;
	}

	[data-ff-grid-action-delete]:disabled {
		opacity: 0.5;
	}

	:global {
		[data-ff-grid-header-cell] {
			&.th-checkbox {
				text-align: center;
			}
		}

		[data-ff-grid-row-cell] {
			&.td-checkbox {
				text-align: center;
			}
		}

		[data-ff-grid-header-cell] {
			&.th-number {
				text-align: right;
			}
		}

		[data-ff-grid-row-cell] {
			&.td-number {
				text-align: right;
			}
		}
	}
</style>
