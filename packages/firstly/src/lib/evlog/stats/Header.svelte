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
	<select
		bind:value={year}
		onchange={() => onRefresh()}
		class="border-input focus-visible:border-ring focus-visible:ring-ring rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2"
	>
		{#each defaultYears as y (y)}
			<option value={y}>{y}</option>
		{/each}
	</select>
	<button
		class="hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
		onclick={() => onRefresh()}
		disabled={loading}
	>
		Refresh
	</button>
	{#if loading}<span
			class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			aria-label="loading"
		></span>{/if}
</div>
