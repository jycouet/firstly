<script lang="ts">
	// Grid cell: trace source badge (server vs client).
	let { value }: { value?: string | null } = $props()
</script>

<span
	class="rounded px-1.5 py-0.5 text-[10px] font-medium {value === 'client'
		? 'bg-info/15 text-info'
		: 'bg-muted text-muted-foreground'}">{value ?? 'server'}</span
>
