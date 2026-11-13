<script lang="ts">
	import { DialogBackdrop, DialogContent, DialogTitle } from '@ui-sdk/svelte/dialog'
	import { untrack } from 'svelte'

	import { resolveMessage, type PromptItem } from './dialog.svelte.js'
	import { ffConfig } from './FF_Config.svelte.js'

	// Rendered inside the manager's ui-sdk `<Dialog>`, which owns focus, Esc and outside presses.
	let {
		item,
		onsubmit,
		oncancel,
	}: {
		item: PromptItem
		onsubmit: (value: string) => void
		oncancel: () => void
	} = $props()

	// Labels fall back to `<FF_Config>` (then the built-in) when the call site omits them.
	const cfg = ffConfig()

	// Seed once from the (per-instance, keyed) item; the user then edits `value` freely.
	let value = $state(untrack(() => item.initial))

	const anim =
		'transition-opacity duration-120 data-ending-style:opacity-0 data-starting-style:opacity-0'
</script>

<DialogBackdrop class="fixed inset-0 bg-black/50 {anim}" />
<DialogContent
	aria-label={item.title ? undefined : item.label ? resolveMessage(item.label) : undefined}
	class="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-background p-5 text-foreground shadow-xl {anim}"
>
	<form
		onsubmit={(e) => {
			e.preventDefault()
			onsubmit(value.trim())
		}}
	>
		{#if item.title}
			<DialogTitle class="mb-2 text-lg font-semibold">{resolveMessage(item.title)}</DialogTitle>
		{/if}
		{#if item.label}
			<label class="mb-1 block text-sm text-muted-foreground" for="ff-prompt-{item.id}">
				{resolveMessage(item.label)}
			</label>
		{/if}
		<input
			id="ff-prompt-{item.id}"
			bind:value
			placeholder={item.placeholder}
			class="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		/>
		{#if item.hint}
			<p class="mt-1 text-xs text-muted-foreground">{item.hint(value)}</p>
		{/if}
		<div class="mt-5 flex justify-end gap-2">
			<button
				type="button"
				class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
				onclick={oncancel}
			>
				{resolveMessage(item.cancelLabel ?? cfg.messages.cancel)}
			</button>
			<button
				type="submit"
				class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
			>
				{resolveMessage(item.confirmLabel ?? cfg.messages.ok)}
			</button>
		</div>
	</form>
</DialogContent>
