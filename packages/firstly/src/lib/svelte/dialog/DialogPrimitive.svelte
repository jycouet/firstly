<script lang="ts">
	import { createDialog } from '@melt-ui/svelte'
	import { createEventDispatcher } from 'svelte'
	import { fade } from 'svelte/transition'

	import { LibIcon_Cross, type BaseItemLight } from '../../internals'
	import Icon from '../../ui/Icon.svelte'
	import LinkPlus from '../../ui/link/LinkPlus.svelte'
	import { flyAndScale } from '../../utils/transition'

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

<div {...$portalled} use:$portalled.action data-ff-dialog-root class={classes.root}>
	{#if $localOpen}
		<div
			{...$overlay}
			use:$overlay.action
			data-ff-dialog-overlay
			transition:fade={{ duration: 150 }}
		></div>
		<div
			data-ff-dialog-content
			transition:flyAndScale={{
				duration: 150,
				y: 8,
				start: 0.96,
			}}
			{...$content}
			use:$content.action
		>
			<div data-ff-dialog-header>
				<h2 {...$localTitle} use:$localTitle.action data-ff-dialog-title>
					<div data-ff-dialog-header-content>
						<LinkPlus item={detail}></LinkPlus>
						<button {...$close} use:$close.action aria-label="close" data-ff-dialog-close>
							<Icon data={LibIcon_Cross}></Icon>
						</button>
					</div>
				</h2>
			</div>

			<div data-ff-dialog-body>
				<slot />

				{#if $$slots.actions}
					<div data-ff-dialog-actions>
						<slot name="actions" />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	[data-ff-dialog-root] {
		position: fixed;
		top: 0;
		z-index: 50;
		display: flex;
		height: 100%;
		width: 100%;
		align-items: center;
		justify-content: center;
	}

	[data-ff-dialog-overlay] {
		position: fixed;
		inset: 0;
		z-index: 40;
		background-color: var(--ff-dialog-overlay);
		backdrop-filter: blur(2px);
	}

	[data-ff-dialog-content] {
		position: relative;
		z-index: 40;
		max-height: 90vh;
		overflow: auto;
		border-radius: 0.75rem;
		border: 1px solid rgb(20 20 20 / 0.6);
		background-color: var(--ff-dialog-content);
		padding: 1.5rem;
		box-shadow:
			0 10px 15px -3px rgb(0 0 0 / 0.1),
			0 4px 6px -4px rgb(0 0 0 / 0.1);
	}

	[data-ff-dialog-header] {
		width: 100%;
		margin-bottom: 1rem;
	}

	[data-ff-dialog-title] {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.75rem;
		font-weight: 500;
	}

	[data-ff-dialog-header-content] {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	[data-ff-dialog-close] {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2.5rem;
		width: 2.5rem;
		min-height: 0;
		border-radius: 9999px;
		border: none;
		background-color: transparent;
	}

	[data-ff-dialog-body] {
		display: flex;
		height: 100%;
		min-width: 25rem;
		flex-direction: column;
		gap: 1rem;
	}

	[data-ff-dialog-actions] {
		margin-top: 0.5rem;
		display: flex;
		align-items: flex-end;
		justify-content: flex-end;
	}
</style>
