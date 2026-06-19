<script lang="ts">
	import type { MonthlyTraceStat } from '../EvlogStatsController.js'
	import MonthBars from './_ui/MonthBars.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { data: MonthlyTraceStat[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const bars = $derived.by(() => {
		const byMonth: Record<string, { server: number; client: number }> = {}
		for (const r of data) {
			const m = (byMonth[r.month] ??= { server: 0, client: 0 })
			m[r.source] += r.count
		}
		return Object.entries(byMonth)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([month, v]) => ({
				label: month.slice(5),
				total: v.server + v.client,
				segments: [
					{ name: 'server', value: v.server, class: 'bg-primary' },
					{ name: 'client', value: v.client, class: 'bg-info' },
				],
			}))
	})
	const total = $derived(data.reduce((s, r) => s + r.count, 0))
</script>

<Section title="Requests per month" hint="server vs client traces" class={klass}>
	{#snippet aside()}{total.toLocaleString()} total{/snippet}
	{#if bars.length}
		<MonthBars
			{bars}
			legend={[
				{ name: 'server', class: 'bg-primary' },
				{ name: 'client', class: 'bg-info' },
			]}
		/>
	{:else}
		<p class="py-10 text-center text-xs text-muted-foreground">No traces recorded yet.</p>
	{/if}
</Section>
