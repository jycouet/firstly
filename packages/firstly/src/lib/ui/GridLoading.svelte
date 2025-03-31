<script lang="ts">
	import { tw } from '../utils/tailwind'
	import type { Align } from './index.js'
	import Loading from './Loading.svelte'

	export let columns: Align[]
	export let loadingRows = 5
	export let withDoubleLoading = true

	// Random with different size
	let size = [
		// 'w-1/12',
		'w-2/12',
		'w-3/12',
		'w-4/12',
		'w-5/12',
		// 'w-6/12',
		'w-7/12',
		// 'w-8/12',
		'w-9/12',
		'w-10/12',
		'w-11/12',
		'w-full',
	]
</script>

<!-- Do 10 rows -->
{#each new Array(loadingRows) as _row, r}
	<tr>
		{#each columns as column, c}
			{@const sizeIndex = parseInt(
				(((r + 1) * (c + 1) * Math.random() * size.length) % size.length).toString(),
			)}
			<td class={column}>
				<div class={tw('flex justify-between', column === 'text-right' && 'flex-row-reverse')}>
					{#if column === 'text-center'}
						<div></div>
					{/if}
					<Loading class={tw(`h-4`, size[sizeIndex])} />
					<div></div>
				</div>

				{#if withDoubleLoading}
					{@const sizeIndex2 = parseInt(
						(((r + 1) * (c + 1) * Math.random() * sizeIndex) % sizeIndex).toString(),
					)}
					<div class={tw('mt-2 flex justify-between', column === 'text-right' && 'flex-row-reverse')}>
						{#if column === 'text-center'}
							<div></div>
						{/if}
						<Loading class={tw(`h-3`, size[sizeIndex2])} />
						<div></div>
					</div>
				{/if}
			</td>
		{/each}
	</tr>
{/each}
