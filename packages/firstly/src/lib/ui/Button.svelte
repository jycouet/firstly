<script lang="ts">
	import { createTooltip } from '@melt-ui/svelte'
	import type { Action } from 'svelte/action'
	import { createBubbler, run } from 'svelte/legacy'
	import { fade, fly } from 'svelte/transition'

	import { remult } from 'remult'

	import { BaseEnum, tw } from '../internals'

	const bubble = createBubbler()

	interface Props {
		isLoading?: boolean
		class?: string | undefined | null
		permission?: BaseEnum[] | BaseEnum | undefined
		children?: import('svelte').Snippet
		tooltip?: import('svelte').Snippet
		[key: string]: any
	}

	let {
		isLoading = false,
		class: className = 'btn-primary',
		permission = undefined,
		children,
		tooltip,
		...rest
	}: Props = $props()

	let permissionDisabled = $state(false)
	let disabled = $derived(rest.disabled || permissionDisabled || isLoading)

	// let's trigger the annimation if it's more than 200ms
	let triggerAnnimation = $state(false)
	run(() => {
		isLoading &&
			setTimeout(() => {
				if (isLoading) {
					// eslint-disable-next-line
					triggerAnnimation = true
				}
			}, 200)
	})

	let updates = (param: { permission: BaseEnum[] | BaseEnum | undefined }) => {
		if (param && param.permission) {
			permissionDisabled = !remult.isAllowed(
				Array.isArray(param.permission) ? param.permission.map((c) => c.id) : param.permission.id,
			)
			if (permissionDisabled) {
				disabledWhy = `Vous n'avez pas la permission: ${Array.isArray(param.permission) ? param.permission.map((c) => `"${c.caption}"`).join(' ou ') : `"${param.permission.caption}"`}`
			} else {
				disabledWhy = ''
			}
		} else {
			permissionDisabled = false
			disabledWhy = ''
		}
	}

	let disabledWhy = $state('')
	const isAllowed: Action<HTMLElement, { permission: BaseEnum[] | BaseEnum | undefined }> = (
		node,
		param,
	) => {
		// the node has been mounted in the DOM
		// @ts-ignore
		updates(param)

		return {
			update(param) {
				// the value of `bar` has changed
				updates(param)
			},

			destroy() {
				// the node has been removed from the DOM
			},
		}
	}

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
	use:isAllowed={{ permission }}
	onclick={bubble('click')}
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

{#if $open && (disabledWhy || tooltip)}
	<div
		{...$content}
		use:content
		transition:fade={{ duration: 100 }}
		class="z-30 rounded-lg bg-base-300 ring-1 ring-black"
	>
		<div {...$arrow} use:arrow></div>
		<div class="px-4 py-1">
			{#if tooltip}
				{@render tooltip?.()}
			{:else}
				{disabledWhy}
			{/if}
		</div>
	</div>
{/if}

<style>
	.btn[disabled] {
		pointer-events: all;
		cursor: not-allowed;
	}
</style>
