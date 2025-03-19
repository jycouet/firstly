<script lang="ts" generics="entityType = unknown">
	import { type FieldMetadata } from 'remult'

	import type { FF_Repo } from './FF_Repo.svelte'

	interface Props<entityType> {
		uid?: string
		r: FF_Repo<entityType>
		fields?: FieldMetadata<unknown, entityType>[]

		classes?: {
			root?: string
		}
	}

	let {
		r,
		fields = r.repo.fields.toArray().filter((c) => c.apiUpdateAllowed()),
		classes = {
			root: 'table',
		},
	}: Props<entityType> = $props()
</script>

<table data-ff-grid class={classes?.root}>
	<thead>
		<tr data-ff-grid-header>
			{#each fields ?? [] as item (item.key)}
				<th data-ff-grid-header-cell>{item.caption}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#if r.loading.init}
			{#each Array(10) as _}
				<tr>
					{#each fields ?? [] as item (item.key)}
						<td class="cell-loading"></td>
					{/each}
				</tr>
			{/each}
		{/if}
		{#each r.items ?? [] as item (r.repo.metadata.idMetadata.getId(item))}
			<tr data-ff-grid-row>
				{#each fields as f (f.key)}
					<td data-ff-grid-row-cell>{f.displayValue(item as Partial<entityType>)}</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
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
