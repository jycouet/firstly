<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'
	import BarRow from './_ui/BarRow.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { os: UserAgentStat[]; devices: UserAgentStat[]; class?: string }
	let { os, devices, class: klass = '' }: Props = $props()

	const osMax = $derived(Math.max(0, ...os.map((d) => d.count)))
	const devMax = $derived(Math.max(0, ...devices.map((d) => d.count)))
</script>

<Section title="OS & devices" hint="from parsed user-agent" class={klass}>
	{#if os.length || devices.length}
		<div class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
			<div class="flex flex-col">
				<div class="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">OS</div>
				{#each os as item (item.name)}
					<BarRow
						label={item.name}
						value={item.count}
						max={osMax}
						sub={`${item.percent}%`}
						barClass="bg-primary"
					/>
				{:else}
					<p class="text-xs text-muted-foreground">No data.</p>
				{/each}
			</div>
			<div class="flex flex-col">
				<div class="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
					Device
				</div>
				{#each devices as item (item.name)}
					<BarRow
						label={item.name}
						value={item.count}
						max={devMax}
						sub={`${item.percent}%`}
						barClass="bg-info"
					/>
				{:else}
					<p class="text-xs text-muted-foreground">No data.</p>
				{/each}
			</div>
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">
			Enable <code class="font-mono">context: {'{'} userAgent: true }</code> in
			<code class="font-mono">evlog()</code>.
		</p>
	{/if}
</Section>
