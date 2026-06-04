<script lang="ts">
	let { value = $bindable(), id }: { value?: unknown; id?: string } = $props()
</script>

<input {id} value={String(value ?? '')} oninput={(e) => (value = e.currentTarget.value)} />
