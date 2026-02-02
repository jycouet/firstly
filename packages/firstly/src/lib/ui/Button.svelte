<script lang="ts">
	import { createTooltip } from '@melt-ui/svelte'
	import { fade, fly } from 'svelte/transition'

	import { tw } from '../internals'

	// TODO: extend HTMLButtonAttributes ?
	interface Props {
		isLoading?: boolean
		tooltip?: import('svelte').Snippet
		class?: string
		children?: import('svelte').Snippet
		disabled?: boolean | null
		[key: string]: any
	}

	let {
		isLoading = false,
		class: className = '',
		children,
		tooltip,
		disabled: disabledProp,
		...rest
	}: Props = $props()

	let disabled = $derived(disabledProp || isLoading)

	// let's trigger the annimation if it's more than 200ms
	let triggerAnnimation = $state(false)
	$effect(() => {
		isLoading &&
			setTimeout(() => {
				if (isLoading) {
					triggerAnnimation = true
				}
			}, 200)
	})

	const {
		elements: { trigger, content, arrow },
		states: { open },
	} = createTooltip({
		positioning: {
			placement: 'top',
		},
		openDelay: 0,
		closeDelay: 0,
		closeOnPointerDown: false,
		forceVisible: true,
		escapeBehavior: 'close',
		group: true,
	})
</script>

<button
	{...$trigger}
	use:trigger
	{...rest}
	class={tw(['btn', className])}
	{disabled}
>
	<!-- btn-outline -->
	{@render children?.()}
	{#if triggerAnnimation && isLoading}
		<div in:fly={{ x: -20 }}>
			<span class="loading loading-spinner"></span>
		</div>
	{/if}
</button>

{#if $open && tooltip}
	<div
		{...$content}
		use:content
		transition:fade={{ duration: 100 }}
		class="z-30 rounded-lg bg-base-300 ring-1 ring-black"
	>
		<div {...$arrow} use:arrow></div>
		<div class="px-4 py-1">
			{@render tooltip?.()}
		</div>
	</div>
{/if}

<style>
	.btn[disabled] {
		pointer-events: all;
		cursor: not-allowed;
	}
</style>
