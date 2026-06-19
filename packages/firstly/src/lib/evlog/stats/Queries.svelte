<script lang="ts">
	import type { QueryStat, QueryStats } from '../EvlogStatsController.js'
	import Section from './_ui/Section.svelte'

	type Props = { data: QueryStats; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const tabs = [
		{ key: 'slowest', label: 'Slowest', hint: 'by max single duration', metric: (q: QueryStat) => q.maxMs, unit: ' ms' },
		{ key: 'mostTime', label: 'Most time', hint: 'by total time spent', metric: (q: QueryStat) => q.totalMs, unit: ' ms' },
		{ key: 'hottest', label: 'Hottest', hint: 'by call count', metric: (q: QueryStat) => q.count, unit: '' },
	] as const
	let active = $state<'slowest' | 'mostTime' | 'hottest'>('slowest')
	const tab = $derived(tabs.find((t) => t.key === active)!)
	const rows = $derived(data[active] ?? [])
	const max = $derived(Math.max(0, ...rows.map((r) => tab.metric(r))))
	const fmt = (n: number) => n.toLocaleString()
</script>

<Section title="SQL queries" hint={tab.hint} class={klass}>
	{#snippet aside()}
		<div class="flex gap-0.5 rounded-md bg-muted/60 p-0.5">
			{#each tabs as t (t.key)}
				<button
					type="button"
					onclick={() => (active = t.key)}
					class="rounded px-2 py-0.5 text-[11px] font-medium transition-colors {active === t.key
						? 'bg-card text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}">{t.label}</button
				>
			{/each}
		</div>
	{/snippet}

	{#if rows.length}
		<div class="flex flex-col gap-3">
			{#each rows as q (q.fullSql)}
				<div class="flex flex-col gap-1">
					<div class="flex items-baseline gap-3">
						<code class="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground" title={q.fullSql}>{q.sql}</code>
						<span class="shrink-0 text-xs font-semibold tabular-nums text-foreground"
							>{fmt(tab.metric(q))}{tab.unit}</span
						>
					</div>
					<div class="h-1.5 overflow-hidden rounded-full bg-muted/60">
						<div
							class="h-full rounded-full bg-primary"
							style="width:{max > 0 ? Math.max(3, Math.round((tab.metric(q) / max) * 100)) : 0}%"
						></div>
					</div>
					<div class="flex flex-wrap items-center gap-x-3 text-[10px] text-muted-foreground">
						<span>{fmt(q.count)} calls</span>
						<span>avg {q.avgMs} ms</span>
						<span>max {q.maxMs} ms</span>
						{#if q.topPaths.length}
							<span class="min-w-0 truncate font-mono">{q.topPaths.map((p) => p.path).join('  ')}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">No SQL spans recorded.</p>
	{/if}
</Section>
