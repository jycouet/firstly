<script lang="ts">
	import type { EvlogStatsData } from '../EvlogStatsController.js'

	type Props = {
		data: EvlogStatsData['totals']
		year: number
	}
	let { data, year }: Props = $props()
	const fmt = (n: number) => n.toLocaleString()
</script>

<div
	class="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3"
>
	<div class="bg-card p-4">
		<div class="text-xs font-medium text-muted-foreground">Traces</div>
		<div class="text-2xl font-bold text-primary">{fmt(data.traces)}</div>
		<div class="text-xs text-muted-foreground">in {year}</div>
	</div>
	<div class="bg-card p-4">
		<div class="text-xs font-medium text-muted-foreground">Audits</div>
		<div class="text-2xl font-bold text-foreground">{fmt(data.audits)}</div>
		<div class="text-xs text-muted-foreground">create / update / delete</div>
	</div>
	<div class="bg-card p-4">
		<div class="text-xs font-medium text-muted-foreground">Unique actors</div>
		<div class="text-2xl font-bold text-foreground">{fmt(data.uniqueActors)}</div>
		<div class="text-xs text-muted-foreground">across both tables</div>
	</div>
</div>
