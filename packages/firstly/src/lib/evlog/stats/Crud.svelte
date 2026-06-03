<script lang="ts">
	import type { MonthlyAuditStat } from '../EvlogStatsController.js'

	type Props = { data: MonthlyAuditStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
	const monthLabel = (m: string) =>
		new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">CRUD per month</h3>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
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
						<tr><td colspan="6" class="text-center text-muted-foreground">No data</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
