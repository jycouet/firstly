<script lang="ts">
	import type { QueryStat } from '../EvlogStatsController.js'

	type Props = { data: QueryStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">SQL - slowest single executions</h3>
		<p class="text-xs text-muted-foreground">
			Sorted by <code>max(duration)</code> per SQL string. Use this to find one-off pathological queries.
		</p>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
				<thead>
					<tr>
						<th>SQL</th>
						<th class="text-right text-error">Max ms</th>
						<th class="text-right">Calls</th>
						<th class="text-right">Total ms</th>
						<th>Top triggering paths</th>
					</tr>
				</thead>
				<tbody>
					{#each data as q (q.fullSql)}
						<tr>
							<td class="max-w-[42ch] truncate font-mono text-[10px]" title={q.fullSql}>{q.sql}</td>
							<td class="text-right font-mono text-error">{q.maxMs}</td>
							<td class="text-right font-mono">{fmt(q.count)}</td>
							<td class="text-right font-mono text-muted-foreground">{q.totalMs}</td>
							<td class="text-xs">
								{#each q.topPaths as p, i (p.path)}
									{#if i > 0}<span class="text-muted-foreground"> · </span>{/if}<span
										class="font-mono"
										title="{p.count} calls">{p.path}</span
									><span class="text-muted-foreground"> ({p.count})</span>
								{/each}
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-center text-muted-foreground">No SQL spans recorded</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
