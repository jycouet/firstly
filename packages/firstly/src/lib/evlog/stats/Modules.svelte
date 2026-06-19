<script lang="ts">
	import type { MonthlyModuleStat } from '../EvlogStatsController.js'
	import BarRow from './_ui/BarRow.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { data: MonthlyModuleStat[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	// Aggregate per-month rows into one bar per module.
	const rows = $derived.by(() => {
		const byModule: Record<string, number> = {}
		for (const r of data) byModule[r.module] = (byModule[r.module] ?? 0) + r.count
		return Object.entries(byModule)
			.map(([module, count]) => ({ module, count }))
			.sort((a, b) => b.count - a.count)
	})
	const max = $derived(Math.max(0, ...rows.map((r) => r.count)))
</script>

<Section title="By module" hint="audit events tagged with a module" class={klass}>
	{#if rows.length}
		<div class="flex flex-col">
			{#each rows as r (r.module)}
				<BarRow label={r.module} value={r.count} {max} barClass="bg-primary" />
			{/each}
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">No module-tagged events.</p>
	{/if}
</Section>
