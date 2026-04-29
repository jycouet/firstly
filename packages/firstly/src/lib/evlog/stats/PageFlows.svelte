<script lang="ts">
	import type { PageFlow } from '../EvlogStatsController.js'

	type Props = { data: PageFlow[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">Top navigation flows</h3>
		<div class="overflow-x-auto">
			<table class="table table-xs">
				<thead>
					<tr>
						<th>From</th>
						<th></th>
						<th>To</th>
						<th class="text-right">Count</th>
					</tr>
				</thead>
				<tbody>
					{#each data as f (f.fromPage + '->' + f.toPage)}
						<tr>
							<td class="font-mono text-xs">{f.fromPage}</td>
							<td class="text-center">→</td>
							<td class="font-mono text-xs">{f.toPage}</td>
							<td class="text-right font-mono">{fmt(f.count)}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="text-center text-base-content/60">No flows yet</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
