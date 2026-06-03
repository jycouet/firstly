<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'

	type Props = {
		os: UserAgentStat[]
		devices: UserAgentStat[]
	}
	let { os, devices }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<h3 class="text-base font-semibold text-foreground">OS &amp; devices</h3>
		{#if os.length === 0 && devices.length === 0}
			<p class="text-xs text-muted-foreground">
				Set <code>context: &lbrace; userAgent: true &rbrace;</code> in <code>evlog()</code> to populate
				<code>event.userAgent.os</code> and <code>.device</code>.
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="mb-1 text-xs tracking-wide text-muted-foreground uppercase">OS</div>
					<ul class="space-y-1">
						{#each os as item (item.name)}
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
				</div>
				<div>
					<div class="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Device</div>
					<ul class="space-y-1">
						{#each devices as item (item.name)}
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
				</div>
			</div>
		{/if}
	</div>
</div>
