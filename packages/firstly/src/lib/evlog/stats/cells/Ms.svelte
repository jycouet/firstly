<script lang="ts">
	// Grid cell: a duration in ms, warmer as it gets slower.
	let { value }: { value?: number | null } = $props()
	const n = $derived(value == null ? null : Math.round(value))
	const tone = $derived(
		n == null
			? 'text-muted-foreground'
			: n >= 500
				? 'text-error'
				: n >= 100
					? 'text-warning'
					: 'text-foreground',
	)
</script>

<span class="font-mono text-xs tabular-nums {tone}"
	>{n == null ? '—' : `${n.toLocaleString()} ms`}</span
>
