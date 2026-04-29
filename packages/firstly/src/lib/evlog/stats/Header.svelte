<script lang="ts">
	type Props = {
		/** Bindable selected year. */
		year: number
		/** Show the spinner next to the refresh button. */
		loading?: boolean
		/** Called when the user picks a different year or clicks Refresh. */
		onRefresh: () => void | Promise<void>
		/** Heading text. Default `"Evlog Stats"`. */
		title?: string
		/** Years to show in the dropdown. Default: current year ±2. */
		years?: number[]
	}

	let {
		year = $bindable(),
		loading = false,
		onRefresh,
		title = 'Evlog Stats',
		years,
	}: Props = $props()

	const defaultYears = $derived(years ?? [year - 2, year - 1, year, year + 1])
</script>

<div class="flex items-center gap-3">
	<h2 class="text-xl font-semibold">{title}</h2>
	<select bind:value={year} onchange={() => onRefresh()} class="select-bordered select select-sm">
		{#each defaultYears as y (y)}
			<option value={y}>{y}</option>
		{/each}
	</select>
	<button class="btn btn-ghost btn-sm" onclick={() => onRefresh()} disabled={loading}>
		Refresh
	</button>
	{#if loading}<span class="loading loading-sm loading-spinner"></span>{/if}
</div>
