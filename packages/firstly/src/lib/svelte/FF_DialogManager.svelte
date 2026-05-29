<script lang="ts">
	import type { Snippet } from 'svelte'
	import { fade } from 'svelte/transition'

	import {
		dialog,
		ffAutofocus,
		ffTrapFocus,
		resolveMessage,
		type DialogClose,
		type DialogConfirmArgs,
		type DialogPromptArgs,
		type DialogShellArgs,
	} from './dialog.svelte.js'
	import { ffConfig } from './FF_Config.svelte.js'
	import FF_PromptDefault from './FF_PromptDefault.svelte'

	let {
		shell,
		confirm,
		prompt,
	}: {
		/** Override the dialog frame. Omit to fall back to `<FF_Config>`, then the built-in default. */
		shell?: Snippet<[DialogShellArgs]>
		/** Override the confirm UI. Omit to fall back to `<FF_Config>`, then the built-in default. */
		confirm?: Snippet<[DialogConfirmArgs]>
		/** Override the prompt UI. Omit to fall back to `<FF_Config>`, then the built-in default. */
		prompt?: Snippet<[DialogPromptArgs]>
	} = $props()

	// App-wide config (labels + skin) from the nearest `<FF_Config>`; precedence is
	// explicit prop > FF_Config > built-in. Read once at init; its getters stay reactive.
	const cfg = ffConfig()

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

	// Snapshot the element focused before the first dialog opened, and restore focus to it once
	// everything is closed (otherwise focus falls back to <body>). The `ffAutofocus`/`ffTrapFocus`
	// actions on each panel own focus WHILE open; this only fires the restore on the 0-open edge.
	// SSR-safe (effects don't run on the server).
	let restoreTo: HTMLElement | null = null
	$effect(() => {
		if (typeof document === 'undefined') return
		if (total > 0 && restoreTo === null) {
			restoreTo = document.activeElement as HTMLElement | null
		} else if (total === 0 && restoreTo !== null) {
			const el = restoreTo
			restoreTo = null
			if (el.isConnected) el.focus()
		}
	})

	// Mark the app root `inert` (+ aria-hidden) while any dialog is open, so the background can't
	// be tabbed into or read by AT. The dialog panels render at the document body level (a sibling
	// of the app root), so inerting the root never touches the panels. SSR-safe.
	$effect(() => {
		if (typeof document === 'undefined' || total === 0) return
		const root = document.querySelector<HTMLElement>('[data-sveltekit-root], #svelte, body > div:first-child')
		if (!root || root.contains(document.activeElement)) {
			// Fallback: no identifiable single root, or the dialog itself lives under it - skip
			// inert (the per-panel focus trap still contains keyboard navigation).
			return
		}
		root.setAttribute('inert', '')
		root.setAttribute('aria-hidden', 'true')
		return () => {
			root.removeAttribute('inert')
			root.removeAttribute('aria-hidden')
		}
	})

	const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }
</script>

<svelte:window onkeydown={onKeydown} />

{#each dialog.list as d (d.id)}
	{#snippet itemBody(close: DialogClose)}
		{#if d.render.kind === 'component'}
			{@const Comp = d.render.component}
			<Comp {...d.render.props} {close} />
		{:else}
			{@render d.render.body(close)}
		{/if}
	{/snippet}
	{@render (shell ?? cfg.dialog.shell ?? defaultShell)({
		id: d.id,
		body: itemBody,
		close: (r) => dialog._close(d.id, r),
		dismiss: () => dialog.requestClose(d.id),
		dismissible: d.options.dismissible,
		width: d.options.width,
		isTop: d.id === topId,
	})}
{/each}

{#each dialog.confirmList as c (c.id)}
	{@render (confirm ?? cfg.dialog.confirm ?? defaultConfirm)({
		id: c.id,
		message: resolveMessage(c.message),
		title: c.title === undefined ? undefined : resolveMessage(c.title),
		confirmLabel: resolveMessage(c.confirmLabel ?? cfg.messages.confirm),
		cancelLabel: resolveMessage(c.cancelLabel ?? cfg.messages.cancel),
		danger: c.danger,
		confirm: () => dialog._resolveConfirm(c.id, true),
		cancel: () => dialog._resolveConfirm(c.id, false),
		isTop: c.id === topId,
	})}
{/each}

{#each dialog.promptList as p (p.id)}
	{@const promptUi = prompt ?? cfg.dialog.prompt}
	{#if promptUi}
		{@render promptUi({
			id: p.id,
			title: p.title === undefined ? undefined : resolveMessage(p.title),
			label: p.label === undefined ? undefined : resolveMessage(p.label),
			placeholder: p.placeholder,
			initial: p.initial,
			confirmLabel: resolveMessage(p.confirmLabel ?? cfg.messages.ok),
			cancelLabel: resolveMessage(p.cancelLabel ?? cfg.messages.cancel),
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
			use:ffTrapFocus
			role="dialog"
			aria-modal="true"
			tabindex="-1"
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
	id,
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
			use:ffTrapFocus
			role="alertdialog"
			aria-modal="true"
			tabindex="-1"
			aria-labelledby={title ? `ff-dlg-title-${id}` : undefined}
			aria-label={title ? undefined : message}
			aria-describedby="ff-dlg-desc-{id}"
			class="bg-background text-foreground border-border relative z-[1] w-full max-w-sm rounded-lg border p-5 shadow-xl"
		>
			{#if title}
				<h2 id="ff-dlg-title-{id}" class="mb-2 text-lg font-semibold">{title}</h2>
			{/if}
			<p id="ff-dlg-desc-{id}" class="text-sm whitespace-pre-line">{message}</p>
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
