<script lang="ts">
	import type { Snippet } from 'svelte'
	import { fade } from 'svelte/transition'

	import { dialog, ffAutofocus, resolveMessage, type DialogClose } from './dialog.svelte.js'
	import FF_PromptDefault from './FF_PromptDefault.svelte'

	/** Args handed to your `shell` snippet - render a backdrop + panel, then `{@render body(close)}`. */
	export type DialogShellArgs = {
		id: number
		body: Snippet<[DialogClose]>
		/** Close with an explicit result, e.g. `close({ ok: true, data })`. */
		close: DialogClose
		/** Dismiss (Esc/backdrop/close button) - honours `dismissible` + `allowClose`. */
		dismiss: () => void
		dismissible: boolean
		width: 'sm' | 'md' | 'lg'
		isTop: boolean
	}

	/** Args handed to your `confirm` snippet. */
	export type DialogConfirmArgs = {
		id: number
		message: string
		title?: string
		confirmLabel: string
		cancelLabel: string
		danger: boolean
		confirm: () => void
		cancel: () => void
		isTop: boolean
	}

	let {
		shell,
		confirm,
		prompt,
	}: {
		/** Override the dialog frame. Omit to use the built-in default (semantic Tailwind tokens, theme-adaptive). */
		shell?: Snippet<[DialogShellArgs]>
		/** Override the confirm UI. Omit to use the built-in default. */
		confirm?: Snippet<[DialogConfirmArgs]>
		/** Override the prompt UI. Omit to use the built-in default. */
		prompt?: Snippet<
			[
				{
					id: number
					title?: string
					label?: string
					placeholder?: string
					initial: string
					confirmLabel: string
					cancelLabel: string
					submit: (value: string) => void
					cancel: () => void
				},
			]
		>
	} = $props()

	const total = $derived(dialog.list.length + dialog.confirmList.length + dialog.promptList.length)
	// Highest id across all kinds = the most-recently-opened (topmost) item.
	const topId = $derived(
		Math.max(
			dialog.list.at(-1)?.id ?? 0,
			dialog.confirmList.at(-1)?.id ?? 0,
			dialog.promptList.at(-1)?.id ?? 0,
		),
	)

	// Esc dismisses the topmost item, whatever kind it is.
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || total === 0) return
		e.preventDefault()
		if ((dialog.promptList.at(-1)?.id ?? 0) === topId) dialog.dismissTopPrompt()
		else if ((dialog.confirmList.at(-1)?.id ?? 0) === topId) dialog.dismissTopConfirm()
		else dialog.dismissTop()
	}

	// Lock body scroll while anything is open.
	$effect(() => {
		if (total === 0) return
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = prev
		}
	})

	const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }
</script>

<svelte:window onkeydown={onKeydown} />

{#each dialog.list as d (d.id)}
	{@render (shell ?? defaultShell)({
		id: d.id,
		body: d.body,
		close: (r) => dialog._close(d.id, r),
		dismiss: () => dialog.requestClose(d.id),
		dismissible: d.options.dismissible,
		width: d.options.width,
		isTop: d.id === topId,
	})}
{/each}

{#each dialog.confirmList as c (c.id)}
	{@render (confirm ?? defaultConfirm)({
		id: c.id,
		message: resolveMessage(c.message),
		title: c.title === undefined ? undefined : resolveMessage(c.title),
		confirmLabel: resolveMessage(c.confirmLabel),
		cancelLabel: resolveMessage(c.cancelLabel),
		danger: c.danger,
		confirm: () => dialog._resolveConfirm(c.id, true),
		cancel: () => dialog._resolveConfirm(c.id, false),
		isTop: c.id === topId,
	})}
{/each}

{#each dialog.promptList as p (p.id)}
	{#if prompt}
		{@render prompt({
			id: p.id,
			title: p.title === undefined ? undefined : resolveMessage(p.title),
			label: p.label === undefined ? undefined : resolveMessage(p.label),
			placeholder: p.placeholder,
			initial: p.initial,
			confirmLabel: resolveMessage(p.confirmLabel),
			cancelLabel: resolveMessage(p.cancelLabel),
			submit: (value) => dialog._resolvePrompt(p.id, value),
			cancel: () => dialog._resolvePrompt(p.id, null),
		})}
	{:else}
		<FF_PromptDefault
			item={p}
			onsubmit={(value) => dialog._resolvePrompt(p.id, value)}
			oncancel={() => dialog._resolvePrompt(p.id, null)}
		/>
	{/if}
{/each}

<!-- Built-in defaults: usable with zero config and theme-adaptive via semantic tokens
	 (background/card/foreground/border/primary/muted/destructive). Pass `shell`/`confirm`/`prompt`
	 to fully restyle. -->
{#snippet defaultShell({ body, close, dismiss, dismissible, width }: DialogShellArgs)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 120 }}
	>
		<button type="button" aria-label="Close" class="absolute inset-0 bg-black/50" onclick={dismiss}
		></button>
		<div
			use:ffAutofocus
			role="dialog"
			aria-modal="true"
			class="bg-background text-foreground border-border relative z-[1] max-h-[90vh] w-full {widthClass[
				width
			]} overflow-auto rounded-lg border p-5 shadow-xl"
		>
			{@render body(close)}
			<!-- Rendered after the body (but absolute top-right) so autofocus lands on the
				 body's first input, and the close button is last in tab order. -->
			{#if dismissible}
				<button
					type="button"
					aria-label="Close"
					class="text-muted-foreground hover:text-foreground absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md"
					onclick={dismiss}
				>
					✕
				</button>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet defaultConfirm({
	message,
	title,
	confirmLabel,
	cancelLabel,
	danger,
	confirm: onConfirm,
	cancel,
}: DialogConfirmArgs)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 120 }}
	>
		<button type="button" aria-label="Cancel" class="absolute inset-0 bg-black/50" onclick={cancel}
		></button>
		<div
			use:ffAutofocus
			role="alertdialog"
			aria-modal="true"
			class="bg-background text-foreground border-border relative z-[1] w-full max-w-sm rounded-lg border p-5 shadow-xl"
		>
			{#if title}
				<h2 class="mb-2 text-lg font-semibold">{title}</h2>
			{/if}
			<p class="text-sm whitespace-pre-line">{message}</p>
			<div class="mt-5 flex justify-end gap-2">
				<button
					type="button"
					class="border-border hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
					onclick={cancel}
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					class="{danger
						? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
						: 'bg-primary text-primary-foreground hover:bg-primary/90'} rounded-md px-3 py-1.5 text-sm font-medium"
					onclick={onConfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/snippet}
