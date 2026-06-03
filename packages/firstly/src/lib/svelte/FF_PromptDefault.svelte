<script lang="ts">
	import { untrack } from 'svelte'
	import { fade } from 'svelte/transition'

	import { ffAutofocus, ffTrapFocus, resolveMessage, type PromptItem } from './dialog.svelte.js'
	import { ffConfig } from './FF_Config.svelte.js'

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
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4"
	transition:fade={{ duration: 120 }}
>
	<button type="button" aria-label="Cancel" class="absolute inset-0 bg-black/50" onclick={oncancel}
	></button>
	<!-- role/aria-modal live on this panel div (a `<form>` can't carry an interactive role); the
		 form inside handles submit. ffTrapFocus keeps Tab within the panel. -->
	<div
		use:ffAutofocus
		use:ffTrapFocus
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby={item.title ? `ff-prompt-title-${item.id}` : undefined}
		aria-label={item.title ? undefined : item.label ? resolveMessage(item.label) : undefined}
		class="bg-background text-foreground border-border relative z-[1] w-full max-w-sm rounded-lg border p-5 shadow-xl"
	>
		<form
			onsubmit={(e) => {
				e.preventDefault()
				onsubmit(value.trim())
			}}
		>
			{#if item.title}
				<h2 id="ff-prompt-title-{item.id}" class="mb-2 text-lg font-semibold">
					{resolveMessage(item.title)}
				</h2>
			{/if}
			{#if item.label}
				<label class="text-muted-foreground mb-1 block text-sm" for="ff-prompt-{item.id}">
					{resolveMessage(item.label)}
				</label>
			{/if}
			<input
				id="ff-prompt-{item.id}"
				bind:value
				placeholder={item.placeholder}
				class="border-border bg-card focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
			/>
			{#if item.hint}
				<p class="text-muted-foreground mt-1 text-xs">{item.hint(value)}</p>
			{/if}
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					class="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
					onclick={oncancel}
				>
					{resolveMessage(item.cancelLabel ?? cfg.messages.cancel)}
				</button>
				<button
					type="submit"
					class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium"
				>
					{resolveMessage(item.confirmLabel ?? cfg.messages.ok)}
				</button>
			</div>
		</form>
	</div>
</div>
