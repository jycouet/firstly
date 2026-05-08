<script lang="ts">
	import { onMount, untrack } from 'svelte'

	import { EvlogStatsController, type EvlogStatsData } from './EvlogStatsController.js'
	import Browsers from './stats/Browsers.svelte'
	import Crud from './stats/Crud.svelte'
	import Header from './stats/Header.svelte'
	import Modules from './stats/Modules.svelte'
	import OsDevices from './stats/OsDevices.svelte'
	import PageFlows from './stats/PageFlows.svelte'
	import QueriesHot from './stats/QueriesHot.svelte'
	import QueriesSlowest from './stats/QueriesSlowest.svelte'
	import QueriesTopTime from './stats/QueriesTopTime.svelte'
	import TopPages from './stats/TopPages.svelte'
	import Totals from './stats/Totals.svelte'
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
</script>

<div class="space-y-4">
	<Header bind:year {loading} onRefresh={load} />

	{#if error}
		<div class="alert text-xs alert-error">{error}</div>
	{:else if stats}
		<Totals data={stats.totals} year={stats.year} />

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Traces data={stats.monthlyTraces} />
			<Crud data={stats.monthlyAudits} />
			<TopPages data={stats.topPages} />
			<PageFlows data={stats.pageFlows} />
			<Browsers data={stats.browsers} />
			<OsDevices os={stats.os} devices={stats.devices} />
			<div class="lg:col-span-2"><Modules data={stats.monthlyByModule} /></div>
			<div class="lg:col-span-2"><QueriesSlowest data={stats.queries.slowest} /></div>
			<div class="lg:col-span-2"><QueriesTopTime data={stats.queries.mostTime} /></div>
			<div class="lg:col-span-2"><QueriesHot data={stats.queries.hottest} /></div>
		</div>
	{/if}
</div>
