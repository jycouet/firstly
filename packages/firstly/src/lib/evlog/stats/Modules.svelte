<script lang="ts">
	import type { MonthlyModuleStat } from '../EvlogStatsController.js'

	type Props = { data: MonthlyModuleStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
	const monthLabel = (m: string) =>
		new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">Events by module per month</h3>
		<p class="text-xs text-muted-foreground">
			Tag any logger / audit emit with <code>module: 'reports'</code> to slice activity per sub-system.
		</p>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
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
							<td
								><span
									class="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
									>{r.module}</span
								></td
							>
							<td class="text-right font-mono">{fmt(r.count)}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="text-center text-muted-foreground">No module-tagged events</td></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
