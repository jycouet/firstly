<script lang="ts">
	import { createDialog } from '@melt-ui/svelte'
	import { createEventDispatcher } from 'svelte'
	import { fade } from 'svelte/transition'

	import { LibIcon_Cross, tw, type BaseItemLight } from '../../internals'
	import { flyAndScale } from '../../utils/transition'
	import Icon from '../Icon.svelte'
	import LinkPlus from '../link/LinkPlus.svelte'

	export let detail: BaseItemLight | undefined = undefined
	export let open: boolean = false
	export let classes: { root?: string } = {}

	const {
		elements: { trigger, overlay, content, title: localTitle, description, close, portalled },
		states: { open: localOpen },
	} = createDialog({
		forceVisible: true,
		defaultOpen: open,
		closeOnOutsideClick: false,
		onOpenChange: (open) => {
			dispatchChange('yop there')
			return open.next
		},
	})

	const dispatch = createEventDispatcher()

	function dispatchChange(_data: any) {
		dispatch('change', _data)
	}
</script>

<div
	{...$portalled}
	use:$portalled.action
	class="fixed top-0 z-40 flex h-full w-full items-center justify-center"
>
	{#if $localOpen}
		<div
			{...$overlay}
			use:$overlay.action
			class="fixed inset-0 z-40 bg-base-300/80 blur-sm"
			transition:fade={{ duration: 150 }}
		></div>
		<div
			class={tw(
				`relative z-40 max-h-[90vh] overflow-auto rounded-xl border border-base-content/60 bg-base-100 p-6 shadow-lg`,
				classes.root,
			)}
			transition:flyAndScale={{
				duration: 150,
				y: 8,
				start: 0.96,
			}}
			{...$content}
			use:$content.action
		>
			<div class="left-0 top-0 mb-4 w-full">
				<h2 {...$localTitle} use:$localTitle.action class="m-0 text-lg font-medium">
					<div class="flex items-center justify-between gap-4">
						<LinkPlus item={detail}></LinkPlus>
						<button
							{...$close}
							use:$close.action
							aria-label="close"
							class="btn btn-circle btn-outline btn-lg
            h-max min-h-0 w-max border-none"
						>
							<Icon data={LibIcon_Cross}></Icon>
						</button>
					</div>
				</h2>
			</div>

			<div class="flex h-full min-w-[25rem] flex-col gap-4">
				<!-- <div class="overflow-y-auto"> -->
				<slot />

				{#if $$slots.actions}
					<div class="mt-2 flex items-end justify-end">
						<slot name="actions" />
					</div>
				{/if}
				<!-- </div> -->
			</div>
		</div>
	{/if}
</div>
