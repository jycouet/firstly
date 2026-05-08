<script lang="ts">
	import type { MonthlyAuditStat } from '../EvlogStatsController.js'

	type Props = { data: MonthlyAuditStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
	const monthLabel = (m: string) =>
		new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">CRUD per month</h3>
		<div class="overflow-x-auto">
			<table class="table table-xs">
				<thead>
					<tr>
						<th>Month</th>
						<th class="text-right">Total</th>
						<th class="text-right text-success">+</th>
						<th class="text-right text-info">~</th>
						<th class="text-right text-error">-</th>
						<th class="text-right">other</th>
					</tr>
				</thead>
				<tbody>
					{#each data as r (r.month)}
						<tr>
							<td>{monthLabel(r.month)}</td>
							<td class="text-right font-mono">{fmt(r.total)}</td>
							<td class="text-right font-mono text-success">{fmt(r.creates)}</td>
							<td class="text-right font-mono text-info">{fmt(r.updates)}</td>
							<td class="text-right font-mono text-error">{fmt(r.deletes)}</td>
							<td class="text-right font-mono">{fmt(r.other)}</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="text-center text-base-content/60">No data</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
