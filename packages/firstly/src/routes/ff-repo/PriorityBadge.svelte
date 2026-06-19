<script lang="ts">
	// Demo of a component cell: rendered via a `{ col, component, rowToProps }` cell escape.
	let { value = 0 }: { value?: number } = $props()
</script>

<span data-prio-badge data-high={value >= 5 || undefined}>{value}</span>

<style>
	[data-prio-badge] {
		display: inline-block;
		min-width: 1.6em;
		text-align: center;
		padding: 1px 7px;
		border-radius: 999px;
		font-variant-numeric: tabular-nums;
		font-size: 12px;
		background: color-mix(in srgb, currentColor 12%, transparent);
	}
	[data-prio-badge][data-high] {
		color: #06241c;
		background: oklch(0.82 0.13 165);
		font-weight: 600;
	}
</style>
