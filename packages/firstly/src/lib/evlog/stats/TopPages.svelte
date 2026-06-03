<script lang="ts">
	import type { TopPage } from '../EvlogStatsController.js'

	type Props = { data: TopPage[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">Top pages</h3>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
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
						<tr><td colspan="3" class="text-center text-muted-foreground">No client navigations</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
