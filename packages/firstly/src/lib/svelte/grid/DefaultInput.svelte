<script lang="ts">
	// Default cell input bundled with the published <FF_Grid> demo (token-only, currentColor based).
	// An app that registers its own inputs via FF_Config.cell.inputs overrides this.
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
	<input {id} type="checkbox" {checked} onchange={(e) => (value = e.currentTarget.checked)} />
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
