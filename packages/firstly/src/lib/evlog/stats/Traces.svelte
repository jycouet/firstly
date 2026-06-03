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

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">Traces per month</h3>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
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
						<tr><td colspan="4" class="text-center text-muted-foreground">No data</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
