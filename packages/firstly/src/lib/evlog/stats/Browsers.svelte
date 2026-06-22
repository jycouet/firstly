<script lang="ts">
	import type { UserAgentStat } from '../EvlogStatsController.js'
	import BarRow from './_ui/BarRow.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { data: UserAgentStat[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const max = $derived(Math.max(0, ...data.map((d) => d.count)))
</script>

<Section title="Browsers" hint="from parsed user-agent" class={klass}>
	{#if data.length}
		<div class="flex flex-col">
			{#each data as item (item.name)}
				<BarRow
					label={item.name}
					value={item.count}
					{max}
					sub={`${item.percent}%`}
					barClass="bg-info"
				/>
			{/each}
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">
			Enable <code class="font-mono">context: {'{'} userAgent: true }</code> in
			<code class="font-mono">evlog()</code>.
		</p>
	{/if}
</Section>
