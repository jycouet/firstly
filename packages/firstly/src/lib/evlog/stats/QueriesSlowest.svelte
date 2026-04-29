<script lang="ts">
	import type { QueryStat } from '../EvlogStatsController.js'

	type Props = { data: QueryStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">SQL - slowest single executions</h3>
		<p class="text-xs text-base-content/60">
			Sorted by <code>max(duration)</code> per SQL string. Use this to find one-off pathological queries.
		</p>
		<div class="overflow-x-auto">
			<table class="table table-xs">
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
							<td class="text-right font-mono text-base-content/60">{q.totalMs}</td>
							<td class="text-xs">
								{#each q.topPaths as p, i (p.path)}
									{#if i > 0}<span class="text-base-content/30"> · </span>{/if}<span
										class="font-mono"
										title="{p.count} calls">{p.path}</span
									><span class="text-base-content/40"> ({p.count})</span>
								{/each}
							</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="text-center text-base-content/60">No SQL spans recorded</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
