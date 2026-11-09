<script lang="ts">
	import { setFFConfig } from '../../FF_Config.svelte.js'
	import type { IconData, IconOptions } from '../icon.js'
	import Icon from '../Icon.svelte'

	let { options, rows, icons }: { options?: IconOptions; rows: string[][]; icons: IconData[] } =
		$props()

	setFFConfig(() => ({ icon: options }))
</script>

<table>
	<tbody>
		{#each rows as cells, r (r)}
			<tr>
				{#each cells as cell, c (c)}
					<td>{cell}</td>
				{/each}
				{#each icons as data, i (i)}
					<td><Icon {data} size="1rem" class="text-muted" /></td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
