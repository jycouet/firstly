<script lang="ts">
	import type { MonthlyTraceStat } from '../EvlogStatsController.js'

	type Props = { data: MonthlyTraceStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
	const monthLabel = (m: string) =>
		new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })

	const months = $derived([...new Set(data.map((r) => r.month))].sort())
	const cell = (month: string, source: 'server' | 'client') => {
		const r = data.find((x) => x.month === month && x.source === source)
		return { count: r?.count ?? 0, users: r?.uniqueUsers ?? 0 }
	}
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">Traces per month</h3>
		<div class="overflow-x-auto">
			<table class="table table-xs">
				<thead>
					<tr>
						<th>Month</th>
						<th class="text-right">Server</th>
						<th class="text-right">Client (nav)</th>
						<th class="text-right">Users</th>
					</tr>
				</thead>
				<tbody>
					{#each months as m (m)}
						{@const s = cell(m, 'server')}
						{@const c = cell(m, 'client')}
						<tr>
							<td>{monthLabel(m)}</td>
							<td class="text-right font-mono">{fmt(s.count)}</td>
							<td class="text-right font-mono text-primary">{fmt(c.count)}</td>
							<td class="text-right">{Math.max(s.users, c.users) || '-'}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="text-center text-base-content/60">No data</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
