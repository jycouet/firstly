<script lang="ts">
	import { createTooltip } from '@melt-ui/svelte'
	import { fade } from 'svelte/transition'

	interface Props {
		text?: string;
		hideTooltip?: boolean;
		children?: import('svelte').Snippet;
		tooltip?: import('svelte').Snippet;
	}

	let {
		text = '',
		hideTooltip = false,
		children,
		tooltip
	}: Props = $props();

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
		// disableHoverableContent: true,
	})
</script>

<button type="button" class="trigger" {...$trigger} use:trigger aria-label="Add">
	{@render children?.()}
</button>
<!-- {hideTooltip} -->
{#if $open && !hideTooltip && (text || tooltip)}
	<div
		{...$content}
		use:content
		transition:fade={{ duration: 100 }}
		class="z-50 rounded-lg bg-base-300 ring-1 ring-black"
	>
		<div {...$arrow} use:arrow></div>
		<div class="px-4 py-1">
			{#if tooltip}
				{@render tooltip?.()}
			{:else}
				{@html text}
			{/if}
		</div>
	</div>
{/if}
