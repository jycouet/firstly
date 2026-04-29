<script lang="ts">
	import type { EvlogStatsData } from '../EvlogStatsController.js'

	type Props = {
		data: EvlogStatsData['totals']
		year: number
	}
	let { data, year }: Props = $props()
	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="stats w-full shadow">
	<div class="stat">
		<div class="stat-title">Traces</div>
		<div class="stat-value text-primary">{fmt(data.traces)}</div>
		<div class="stat-desc">in {year}</div>
	</div>
	<div class="stat">
		<div class="stat-title">Audits</div>
		<div class="stat-value text-secondary">{fmt(data.audits)}</div>
		<div class="stat-desc">create / update / delete</div>
	</div>
	<div class="stat">
		<div class="stat-title">Unique actors</div>
		<div class="stat-value text-accent">{fmt(data.uniqueActors)}</div>
		<div class="stat-desc">across both tables</div>
	</div>
</div>
