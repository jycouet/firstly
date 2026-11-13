<script lang="ts">
	import {
		AlertDialog,
		AlertDialogBackdrop,
		AlertDialogClose,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogTitle,
		createAlertDialogController,
		type AlertDialogController,
	} from '@ui-sdk/svelte/alert-dialog'
	import {
		createDialogController,
		Dialog,
		DialogBackdrop,
		DialogClose,
		DialogContent,
		type DialogController,
		type DialogOpenChangeDetails,
	} from '@ui-sdk/svelte/dialog'
	import { type Snippet } from 'svelte'

	import {
		dialog,
		resolveMessage,
		type ConfirmItem,
		type DialogClose as DialogCloseFn,
		type DialogConfirmArgs,
		type DialogItem,
		type DialogPromptArgs,
		type DialogShellArgs,
		type PromptItem,
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

	type Entry =
		| { kind: 'dialog'; item: DialogItem }
		| { kind: 'confirm'; item: ConfirmItem }
		| { kind: 'prompt'; item: PromptItem }

	// One list ordered by id = open order, so the top layer stacks newest last.
	const live = $derived<Entry[]>(
		[
			...dialog.list.map((item) => ({ kind: 'dialog' as const, item })),
			...dialog.confirmList.map((item) => ({ kind: 'confirm' as const, item })),
			...dialog.promptList.map((item) => ({ kind: 'prompt' as const, item })),
		].sort((a, b) => a.item.id - b.item.id),
	)
	const topId = $derived(live.at(-1)?.item.id ?? 0)

	// One ui-sdk controller per item. Opening through it (after mount) lets ui-sdk record where
	// focus was, so closing returns there; a dialog rendered already open would drop focus on <body>.
	type AnyController = DialogController<unknown, string> | AlertDialogController<unknown, string>
	// Plain (non-reactive) bookkeeping: these are written from the derived/template below.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const controllers = new Map<number, AnyController>()
	function controllerOf(e: Entry): AnyController {
		let c = controllers.get(e.item.id)
		if (!c) {
			c = e.kind === 'confirm' ? createAlertDialogController() : createDialogController()
			controllers.set(e.item.id, c)
		}
		return c
	}

	// The store drops an item the moment its promise resolves. Keep rendering it until ui-sdk
	// reports the exit finished, so the closing transition plays and focus is returned. Done in
	// the derived itself (not an effect): the block must survive the very render that drops it.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const leaving = new Map<number, Entry>()
	let prev: Entry[] = []
	let finishedTick = $state(0)
	const rendered = $derived.by(() => {
		void finishedTick
		const ids = new Set(live.map((e) => e.item.id))
		for (const e of prev) if (!ids.has(e.item.id)) leaving.set(e.item.id, e)
		prev = live
		return [...live, ...leaving.values()].sort((a, b) => a.item.id - b.item.id)
	})
	// Post-render: new items are mounted (open them), gone ones still are (close them).
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const opened = new Set<number>()
	$effect(() => {
		for (const e of rendered) {
			const c = controllerOf(e)
			if (leaving.has(e.item.id)) c.close()
			else if (!opened.has(e.item.id)) {
				opened.add(e.item.id)
				c.open()
			}
		}
	})
	function finished(id: number) {
		if (!leaving.delete(id)) return
		controllers.delete(id)
		opened.delete(id)
		finishedTick++
	}

	// ui-sdk asks to close (Esc, outside press, a Close part): keep it open and let the store
	// decide, since `allowClose` may be async and the store owns the result.
	function onOpenChange(e: Entry, next: boolean, details: DialogOpenChangeDetails) {
		if (next || leaving.has(e.item.id)) return
		details.cancel()
		if (e.kind === 'dialog') dialog.requestClose(e.item.id)
		else if (e.kind === 'confirm')
			dialog._resolveConfirm(e.item.id, details.returnValue === 'confirm')
		else dialog._resolvePrompt(e.item.id, null)
	}

	const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' }
</script>

{#each rendered as e (e.item.id)}
	{#if e.kind === 'dialog'}
		{@const d = e.item}
		{#snippet itemBody(close: DialogCloseFn)}
			{#if d.render.kind === 'component'}
				{@const Comp = d.render.component}
				<Comp {...d.render.props} {close} />
			{:else}
				{@render d.render.body(close)}
			{/if}
		{/snippet}
		<Dialog
			controller={controllerOf(e) as DialogController<unknown, string>}
			dismissible={d.options.dismissible}
			onOpenChange={(next, details) => onOpenChange(e, next, details)}
			onOpenChangeComplete={(o) => !o && finished(d.id)}
		>
			{@render (shell ?? cfg.dialog.shell ?? defaultShell)({
				id: d.id,
				body: itemBody,
				close: (r) => dialog._close(d.id, r),
				dismiss: () => dialog.requestClose(d.id),
				dismissible: d.options.dismissible,
				width: d.options.width,
				isTop: d.id === topId,
			})}
		</Dialog>
	{:else if e.kind === 'confirm'}
		{@const c = e.item}
		<AlertDialog
			controller={controllerOf(e) as AlertDialogController<unknown, string>}
			onOpenChange={(next, details) => onOpenChange(e, next, details)}
			onOpenChangeComplete={(o) => !o && finished(c.id)}
		>
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
		</AlertDialog>
	{:else}
		{@const p = e.item}
		{@const promptUi = prompt ?? cfg.dialog.prompt}
		<Dialog
			controller={controllerOf(e) as DialogController<unknown, string>}
			onOpenChange={(next, details) => onOpenChange(e, next, details)}
			onOpenChangeComplete={(o) => !o && finished(p.id)}
		>
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
		</Dialog>
	{/if}
{/each}

<!-- Built-in defaults: usable with zero config and theme-adaptive via semantic tokens
	 (background/card/foreground/border/primary/muted/destructive). A custom `shell`/`confirm`/`prompt`
	 renders inside the ui-sdk root, so it must use the Dialog/AlertDialog parts (re-exported here). -->
{#snippet defaultShell({ body, close, dismissible, width }: DialogShellArgs)}
	<DialogBackdrop
		class="fixed inset-0 bg-black/50 transition-opacity duration-120 data-ending-style:opacity-0 data-starting-style:opacity-0"
	/>
	<DialogContent
		class="fixed inset-0 m-auto h-fit max-h-[90vh] w-[calc(100%-2rem)] border-border bg-background text-foreground {widthClass[
			width
		]} overflow-auto rounded-lg border p-5 shadow-xl transition-opacity duration-120 data-ending-style:opacity-0 data-starting-style:opacity-0"
	>
		{@render body(close)}
		<!-- After the body (but absolute top-right) so initial focus lands on the body's first
			 input, and the close button is last in tab order. -->
		{#if dismissible}
			<DialogClose
				aria-label="Close"
				class="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
			>
				✕
			</DialogClose>
		{/if}
	</DialogContent>
{/snippet}

{#snippet defaultConfirm({ message, title, confirmLabel, cancelLabel, danger }: DialogConfirmArgs)}
	<AlertDialogBackdrop
		class="fixed inset-0 bg-black/50 transition-opacity duration-120 data-ending-style:opacity-0 data-starting-style:opacity-0"
	/>
	<AlertDialogContent
		class="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-background p-5 text-foreground shadow-xl transition-opacity duration-120 data-ending-style:opacity-0 data-starting-style:opacity-0"
		aria-label={title ? undefined : message}
	>
		{#if title}
			<AlertDialogTitle class="mb-2 text-lg font-semibold">{title}</AlertDialogTitle>
		{/if}
		<AlertDialogDescription class="text-sm whitespace-pre-line">{message}</AlertDialogDescription>
		<div class="mt-5 flex justify-end gap-2">
			<AlertDialogClose class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
				{cancelLabel}
			</AlertDialogClose>
			<AlertDialogClose
				value="confirm"
				class="{danger
					? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
					: 'bg-primary text-primary-foreground hover:bg-primary/90'} rounded-md px-3 py-1.5 text-sm font-medium"
			>
				{confirmLabel}
			</AlertDialogClose>
		</div>
	</AlertDialogContent>
{/snippet}
