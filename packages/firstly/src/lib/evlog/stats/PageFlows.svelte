<script lang="ts">
	import type { PageFlow } from '../EvlogStatsController.js'

	type Props = { data: PageFlow[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">Top navigation flows</h3>
		<div class="overflow-x-auto">
			<table
				class="w-full text-left text-xs [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5"
			>
				<thead>
					<tr>
						<th>From</th>
						<th></th>
						<th>To</th>
						<th class="text-right">Count</th>
					</tr>
				</thead>
				<tbody>
					{#each data as f (f.fromPage + '->' + f.toPage)}
						<tr>
							<td class="font-mono text-xs">{f.fromPage}</td>
							<td class="text-center">→</td>
							<td class="font-mono text-xs">{f.toPage}</td>
							<td class="text-right font-mono">{fmt(f.count)}</td>
						</tr>
					{:else}
						<tr><td colspan="4" class="text-center text-muted-foreground">No flows yet</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
