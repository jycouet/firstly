<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'

	type Props = {
		os: UserAgentStat[]
		devices: UserAgentStat[]
	}
	let { os, devices }: Props = $props()

	const fmt = (n: number) => n.toLocaleString()
</script>

<div class="card bg-base-100 shadow">
	<div class="card-body">
		<h3 class="card-title text-base">OS &amp; devices</h3>
		{#if os.length === 0 && devices.length === 0}
			<p class="text-xs text-base-content/60">
				Same enricher gives you <code>event.userAgent.os</code> and <code>.device</code>.
			</p>
		{:else}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="mb-1 text-xs uppercase tracking-wide text-base-content/60">OS</div>
					<ul class="space-y-1">
						{#each os as item (item.name)}
							<li class="flex items-center gap-2 text-xs">
								<span class="grow truncate">{item.name}</span>
								<span class="font-mono text-base-content/60">{fmt(item.count)}</span>
								<span class="badge badge-xs">{item.percent}%</span>
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<div class="mb-1 text-xs uppercase tracking-wide text-base-content/60">Device</div>
					<ul class="space-y-1">
						{#each devices as item (item.name)}
							<li class="flex items-center gap-2 text-xs">
								<span class="grow truncate">{item.name}</span>
								<span class="font-mono text-base-content/60">{fmt(item.count)}</span>
								<span class="badge badge-xs">{item.percent}%</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>
