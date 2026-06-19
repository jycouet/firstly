<script lang="ts">
	// Grid cell: HTTP status, colored by class (2xx ok / 3xx info / 4xx warn / 5xx error).
	let { value }: { value?: number | null } = $props()
	const tone = $derived(
		value == null
			? 'text-muted-foreground'
			: value >= 500
				? 'text-error'
				: value >= 400
					? 'text-warning'
					: value >= 300
						? 'text-info'
						: 'text-success',
	)
</script>

<span class="font-mono text-xs font-semibold tabular-nums {tone}">{value ?? '—'}</span>
