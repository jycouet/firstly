<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'

	type Props = { data: UserAgentStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">Browsers</h3>
		{#if data.length === 0}
			<p class="text-xs text-base-content/60">
				No <code>event.userAgent</code> on traces. Set
				<code>context: &lbrace; userAgent: true &rbrace;</code>
				in <code>evlog()</code> - see the firstly/evlog README.
			</p>
		{:else}
			<ul class="space-y-1">
				{#each data as item (item.name)}
					<li class="flex items-center gap-2 text-xs">
						<span class="grow truncate">{item.name}</span>
						<span class="font-mono text-base-content/60">{fmt(item.count)}</span>
						<span class="badge badge-xs">{item.percent}%</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
