<script lang="ts">
	import type { MonthlyAuditStat } from '../EvlogStatsController.js'
	import MonthBars from './_ui/MonthBars.svelte'
	import Section from './_ui/Section.svelte'

	type Props = { data: MonthlyAuditStat[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const bars = $derived(
		data
			.toSorted((a, b) => a.month.localeCompare(b.month))
			.map((r) => ({
				label: r.month.slice(5),
				total: r.total,
				segments: [
					{ name: 'create', value: r.creates, class: 'bg-success' },
					{ name: 'update', value: r.updates, class: 'bg-info' },
					{ name: 'delete', value: r.deletes, class: 'bg-error' },
					{ name: 'other', value: r.other, class: 'bg-muted-foreground/40' },
				],
			})),
	)
	const total = $derived(data.reduce((s, r) => s + r.total, 0))
</script>

<Section title="Audit events per month" hint="entity create / update / delete" class={klass}>
	{#snippet aside()}{total.toLocaleString()} total{/snippet}
	{#if total > 0}
		<MonthBars
			{bars}
			legend={[
				{ name: 'create', class: 'bg-success' },
				{ name: 'update', class: 'bg-info' },
				{ name: 'delete', class: 'bg-error' },
				{ name: 'other', class: 'bg-muted-foreground/40' },
			]}
		/>
	{:else}
		<p class="py-10 text-center text-xs text-muted-foreground">
			No audit events. Wrap entities with <code class="font-mono">withEvlog</code> to capture them.
		</p>
	{/if}
</Section>
