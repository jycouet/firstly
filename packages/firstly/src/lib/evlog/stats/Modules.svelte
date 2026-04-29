<script lang="ts">
	import type { MonthlyModuleStat } from '../EvlogStatsController.js'

	type Props = { data: MonthlyModuleStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
	const monthLabel = (m: string) =>
		new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">Events by module per month</h3>
		<p class="text-xs text-base-content/60">
			Tag any logger / audit emit with <code>module: 'reports'</code> to slice activity per sub-system.
		</p>
		<div class="overflow-x-auto">
			<table class="table table-xs">
				<thead>
					<tr>
						<th>Month</th>
						<th>Module</th>
						<th class="text-right">Count</th>
					</tr>
				</thead>
				<tbody>
					{#each data as r (r.month + '|' + r.module)}
						<tr>
							<td>{monthLabel(r.month)}</td>
							<td><span class="badge badge-ghost badge-xs">{r.module}</span></td>
							<td class="text-right font-mono">{fmt(r.count)}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="text-center text-base-content/60">No module-tagged events</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
