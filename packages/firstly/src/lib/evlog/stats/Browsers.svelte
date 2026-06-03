<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'

	type Props = { data: UserAgentStat[] }
	let { data }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">Browsers</h3>
		{#if data.length === 0}
			<p class="text-xs text-muted-foreground">
				No <code>event.userAgent</code> on traces. Set
				<code>context: &lbrace; userAgent: true &rbrace;</code>
				in <code>evlog()</code> - see the firstly/evlog README.
			</p>
		{:else}
			<ul class="space-y-1">
				{#each data as item (item.name)}
					<li class="flex items-center gap-2 text-xs">
						<span class="grow truncate">{item.name}</span>
						<span class="font-mono text-muted-foreground">{fmt(item.count)}</span>
						<span
							class="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
							>{item.percent}%</span
						>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
