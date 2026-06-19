<script lang="ts">
	type Props = {
		/** Bindable selected year. */
		year: number
		/** Show the spinner next to the refresh button. */
		loading?: boolean
		/** Called when the user picks a different year or clicks Refresh. */
		onRefresh: () => void | Promise<void>
		/** Heading text. */
		title?: string
		/** Years to show in the dropdown. Default: current year ±2. */
		years?: number[]
	}

	let { year = $bindable(), loading = false, onRefresh, title = 'evlog', years }: Props = $props()

	const defaultYears = $derived(years ?? [year - 2, year - 1, year, year + 1])
</script>

<div class="flex flex-wrap items-center gap-3">
	<div class="mr-auto flex items-baseline gap-2">
		<h2 class="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
		<span class="text-xs text-muted-foreground">backend observability</span>
	</div>

	<select
		bind:value={year}
		onchange={() => onRefresh()}
		aria-label="Select year"
		class="rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
	>
		{#each defaultYears as y (y)}
			<option value={y}>{y}</option>
		{/each}
	</select>

	<button
		type="button"
		onclick={() => onRefresh()}
		disabled={loading}
		class="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
	>
		{#if loading}
			<span
				class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
				aria-label="loading"
			></span>
		{/if}
		Refresh
	</button>
</div>
