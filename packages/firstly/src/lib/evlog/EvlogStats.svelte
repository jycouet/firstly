<script lang="ts">
	import { onMount, untrack } from 'svelte'

	import FF_Grid from '../svelte/grid/FF_Grid.svelte'
	import { EvlogAudit, EvlogTrace, EvlogTraceQuery } from './evlogEntities.js'
	import { EvlogStatsController, type EvlogStatsData } from './EvlogStatsController.js'
	import Browsers from './stats/Browsers.svelte'
	import Crud from './stats/Crud.svelte'
	import Header from './stats/Header.svelte'
	import Modules from './stats/Modules.svelte'
	import OsDevices from './stats/OsDevices.svelte'
	import PageFlows from './stats/PageFlows.svelte'
	import Queries from './stats/Queries.svelte'
	import TopPages from './stats/TopPages.svelte'
	import Traces from './stats/Traces.svelte'

	type Props = {
		/** Year to aggregate over. Defaults to current year. */
		year?: number
		/** Cap rows fetched per table for the JS aggregation. Default 100k. */
		rowLimit?: number
	}
	let { year: initialYear = new Date().getFullYear(), rowLimit = 100_000 }: Props = $props()

	let year = $state(untrack(() => initialYear))
	let stats = $state<EvlogStatsData | null>(null)
	let loading = $state(true)
	let error = $state<string | null>(null)

	type Tab = 'overview' | 'requests' | 'audit' | 'sql'
	let tab = $state<Tab>('overview')
	const tabs: { key: Tab; label: string }[] = [
		{ key: 'overview', label: 'Overview' },
		{ key: 'requests', label: 'Requests' },
		{ key: 'audit', label: 'Audit' },
		{ key: 'sql', label: 'SQL' },
	]

	const fmt = (n: number) => n.toLocaleString()

	async function load() {
		loading = true
		error = null
		try {
			stats = await EvlogStatsController.getStats(year, rowLimit)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			loading = false
		}
	}
	onMount(load)

	const kpis = $derived(
		stats
			? [
					{ label: 'Requests', value: stats.totals.traces },
					{ label: 'Audit events', value: stats.totals.audits },
					{ label: 'Unique actors', value: stats.totals.uniqueActors },
				]
			: [],
	)
</script>

<div class="flex w-full flex-col gap-4">
	<Header bind:year {loading} onRefresh={load} />

	{#if error}
		<div
			role="alert"
			class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
		>
			{error}
		</div>
	{/if}

	{#if stats}
		<div
			class="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card"
		>
			{#each kpis as k (k.label)}
				<div class="px-4 py-3">
					<div class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
						{k.label}
					</div>
					<div class="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">{fmt(k.value)}</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if stats?.truncated}
		<div
			role="alert"
			class="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
		>
			Partial view - the row cap ({fmt(rowLimit)}) was hit, so totals and monthly breakdowns undercount
			the earliest data.
		</div>
	{/if}

	<nav class="flex gap-1 border-b border-border" aria-label="Evlog views">
		{#each tabs as t (t.key)}
			<button
				type="button"
				onclick={() => (tab = t.key)}
				aria-current={tab === t.key ? 'page' : undefined}
				class="-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors {tab === t.key
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground hover:text-foreground'}">{t.label}</button
			>
		{/each}
	</nav>

	{#if tab === 'overview'}
		{#if stats}
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
				<Traces data={stats.monthlyTraces} class="lg:col-span-7" />
				<Crud data={stats.monthlyAudits} class="lg:col-span-5" />
				<TopPages data={stats.topPages} class="lg:col-span-4" />
				<PageFlows data={stats.pageFlows} class="lg:col-span-4" />
				<Modules data={stats.monthlyByModule} class="lg:col-span-4" />
				<Browsers data={stats.browsers} class="lg:col-span-6" />
				<OsDevices os={stats.os} devices={stats.devices} class="lg:col-span-6" />
				<Queries data={stats.queries} class="lg:col-span-12" />
			</div>
		{:else}
			<div class="py-16 text-center text-sm text-muted-foreground">Loading…</div>
		{/if}
	{:else if tab === 'requests'}
		<div class="rounded-xl border border-border bg-card p-2">
			<FF_Grid entity={EvlogTrace} mode="readonly" />
		</div>
	{:else if tab === 'audit'}
		<div class="rounded-xl border border-border bg-card p-2">
			<FF_Grid entity={EvlogAudit} mode="readonly" />
		</div>
	{:else if tab === 'sql'}
		<div class="rounded-xl border border-border bg-card p-2">
			<FF_Grid entity={EvlogTraceQuery} mode="readonly" />
		</div>
	{/if}
</div>
