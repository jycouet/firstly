<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'

	import { scrollbar } from '../../theme'

	export let name: string | null = null
	export let id = ''
	export let rows = 6
	export let placeholder = ''
	export let focus = false
	export let value = ''
	export let readonly = false
	export const error = false
	// unused but needed to avoid Field error 👇
	export let align: `left` | `right` = `left`
	const _tmp = align

	const dispatch = createEventDispatcher()

	let reference: HTMLTextAreaElement

	const initialize = (node: HTMLTextAreaElement) => {
		if (focus) {
			node.focus()
		}
	}

	onMount(() => {
		if (!reference) {
			return
		}
		if (!focus) {
			return
		}
		reference.focus()
	})
	function dispatchInput(value: any) {
		dispatch('input', { value })
	}
</script>

{#if readonly}
	<span class="flex min-h-8 max-w-full items-center px-3 py-1 text-sm md:min-h-[2.5rem]">
		<div class="overflow-hidden">
			{@html value ?? '-'}
		</div>
	</span>
{:else}
	<textarea
		{...$$restProps}
		class="textarea textarea-bordered
			flex h-max min-h-8 w-full items-center
			rounded-lg bg-transparent text-xs shadow-sm shadow-neutral-focus
			md:rounded-xls md:text-sm lg:min-h-[2.5rem]
			{scrollbar.thin}"
		id={id || name || 'default-textarea-id'}
		{name}
		{placeholder}
		autocomplete="off"
		bind:this={reference}
		bind:value
		{rows}
		use:initialize
		on:input={(e) => {
			// @ts-ignore
			dispatchInput(e.target.value)
		}}
	/>
{/if}
