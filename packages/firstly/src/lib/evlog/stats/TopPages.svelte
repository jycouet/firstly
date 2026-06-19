<script lang="ts">
	import type { TopPage } from '../EvlogStatsController.js'
	import BarRow from './_ui/BarRow.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { data: TopPage[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const max = $derived(Math.max(0, ...data.map((p) => p.count)))
</script>

<Section title="Top pages" hint="most visited client routes" class={klass}>
	{#if data.length}
		<div class="flex flex-col">
			{#each data as p (p.pathname)}
				<BarRow
					label={p.pathname}
					value={p.count}
					{max}
					sub={p.users ? `${p.users} ${p.users === 1 ? 'user' : 'users'}` : undefined}
					title={p.pathname}
				/>
			{/each}
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">No client navigations captured.</p>
	{/if}
</Section>
