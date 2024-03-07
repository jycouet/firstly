<script lang="ts">
	import { fly } from 'svelte/transition'

	import { tw } from '../'

	export let isLoading = false
	let className: string | undefined | null = undefined
	export { className as class }

	$: disabled = $$restProps.disabled || isLoading

	// let's trigger the annimation if it's more than 200ms
	let triggerAnnimation = false
	$: isLoading &&
		setTimeout(() => {
			if (isLoading) {
				triggerAnnimation = true
			}
		}, 200)
</script>

<button
	on:click
	{...$$restProps}
	class={tw('btn text-white', disabled ? 'btn-outline' : 'btn-primary', className)}
	{disabled}
>
	<slot />
	{#if triggerAnnimation && isLoading}
		<div in:fly={{ x: -20 }}>
			<span class="loading loading-spinner"></span>
		</div>
	{/if}
</button>
