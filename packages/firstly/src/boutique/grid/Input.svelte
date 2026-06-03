<script lang="ts">
	// Boutique default cell input. Copy into your app and restyle. Token-only (currentColor).
	let {
		value = $bindable(),
		id,
		type = 'text',
		placeholder,
	}: { value?: unknown; id?: string; type?: string; placeholder?: string } = $props()

	let checked = $derived(value as boolean)
</script>

{#if type === 'number'}
	<input {id} {placeholder} type="number" bind:value />
{:else if type === 'checkbox'}
	<input
		{id}
		type="checkbox"
		{checked}
		onchange={(e) => (value = e.currentTarget.checked)}
	/>
{:else}
	<input
		{id}
		{placeholder}
		type="text"
		value={String(value ?? '')}
		oninput={(e) => (value = e.currentTarget.value)}
	/>
{/if}

<style>
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 5px 7px;
		font: inherit;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
		border-radius: 6px;
	}
	input[type='checkbox'] {
		width: auto;
	}
</style>
