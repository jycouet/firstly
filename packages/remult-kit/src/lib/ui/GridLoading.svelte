<script lang="ts">
	import { tw } from '../utils/tailwind'
	import type { Align } from './index.js'
	import Loading from './Loading.svelte'

	export let columns: Align[]
	export let loadingRows = 5

	// Random with different size
	let size = ['', 'w-1/2', 'w-1/3', 'w-1/4', 'w-1/5', 'w-1/6']
</script>

<!-- Do 10 rows -->
{#each new Array(loadingRows) as _row, r}
	<tr>
		{#each columns as column, c}
			<td class="{column} ">
				<div class={tw('flex justify-between', column === 'text-right' && 'flex-row-reverse')}>
					{#if column === 'text-center'}
						<div></div>
					{/if}
					<Loading
						class={tw(
							`h-4`,
							size[parseInt((((r + 1) * (c + 1) * Math.random() * size.length) % size.length).toString())],
						)}
					/>
					<div></div>
				</div>
			</td>
		{/each}
	</tr>
{/each}
