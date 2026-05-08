<script lang="ts">
	import type { TopPage } from '../EvlogStatsController.js'

	type Props = { data: TopPage[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">Top pages</h3>
		<div class="overflow-x-auto">
			<table class="table table-xs">
				<thead>
					<tr>
						<th>Path</th>
						<th class="text-right">Visits</th>
						<th class="text-right">Users</th>
					</tr>
				</thead>
				<tbody>
					{#each data as p (p.pathname)}
						<tr>
							<td class="font-mono text-xs">{p.pathname}</td>
							<td class="text-right font-mono">{fmt(p.count)}</td>
							<td class="text-right">{p.users || '-'}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="text-center text-base-content/60">No client navigations</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
