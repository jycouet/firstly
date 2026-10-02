<script lang="ts">
	let { value = undefined }: { value?: unknown } = $props()
	const text = $derived(JSON.stringify(value, null, 1))
</script>

<pre class="max-h-32 max-w-xl overflow-auto text-xs leading-tight whitespace-pre-wrap">{text}</pre>
