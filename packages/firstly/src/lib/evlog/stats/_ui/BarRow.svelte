<script lang="ts">
	type Props = {
		label: string
		value: number
		max: number
		/** Secondary muted text after the label (e.g. "12 users"). */
		sub?: string
		/** Bar fill color (semantic token utility). */
		barClass?: string
		/** Tooltip on the label. */
		title?: string
		href?: string
		fmt?: (n: number) => string
	}
	let {
		label,
		value,
		max,
		sub,
		barClass = 'bg-primary',
		title,
		href,
		fmt = (n) => n.toLocaleString(),
	}: Props = $props()

	// Floor at 3% so a non-zero value is always visible.
	const pct = $derived(max > 0 && value > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0)
</script>

<div class="grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-1">
	<div class="flex min-w-0 items-baseline gap-1.5">
		{#if href}
			<a
				{href}
				{title}
				class="truncate text-xs font-medium text-foreground hover:text-primary hover:underline"
				>{label}</a
			>
		{:else}
			<span {title} class="truncate font-mono text-xs text-foreground">{label}</span>
		{/if}
		{#if sub}<span class="shrink-0 text-[10px] text-muted-foreground">{sub}</span>{/if}
	</div>
	<span class="shrink-0 text-xs font-semibold tabular-nums text-foreground">{fmt(value)}</span>
	<div class="col-span-2 mt-1 h-1.5 overflow-hidden rounded-full bg-muted/60">
		<div class="h-full rounded-full {barClass}" style="width:{pct}%"></div>
	</div>
</div>
