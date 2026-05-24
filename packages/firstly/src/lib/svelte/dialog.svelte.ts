import type { Snippet } from 'svelte'

import type { LocalizedMessage } from '../core/FF_Validators.js'

/** Resolve a `LocalizedMessage` (literal, or a paraglide/i18next message fn) to a string. */
export const resolveMessage = (m: LocalizedMessage): string => (typeof m === 'function' ? m() : m)

/**
 * `dialog` - firstly's headless async dialog layer (Svelte 5 runes).
 *
 * It owns the *logic* only - the queue, the async `show`/`confirm` resolution, the
 * `{ ok, data }` result, and dismissal rules. It ships **no markup**: mount
 * `<FF_DialogManager>` once and give it your own `shell` / `confirm` snippets, so each
 * app styles the dialog however it likes (Tailwind or otherwise) while sharing this
 * behaviour. The dialog body is a snippet receiving a `close(result?)` callback.
 *
 * ```svelte
 * import { dialog } from 'firstly/svelte'
 *
 * {#snippet body(close)}
 *   <input bind:value={name} />
 *   <button onclick={() => close({ ok: true, data: { name } })}>OK</button>
 *   <button onclick={() => close()}>Cancel</button>
 * {/snippet}
 *
 * const r = await dialog.show(body, { dismissible: true })
 * if (r.ok) { ...r.data }
 * ```
 */

export type DialogResult<T> = { ok: true; data: T } | { ok: false }

export type DialogClose<T = unknown> = (result?: { ok: true; data: T } | { ok: false } | T) => void

export type DialogOptions = {
	/** Allow closing via Escape / backdrop / close button. Default true. */
	dismissible?: boolean
	/** Hook to confirm closure (e.g. dirty-form check). Return false to keep it open. */
	allowClose?: () => boolean | Promise<boolean>
	/** Width preset, passed through to your shell snippet. */
	width?: 'sm' | 'md' | 'lg'
}

export type DialogItem = {
	id: number
	body: Snippet<[DialogClose]>
	options: Required<Pick<DialogOptions, 'dismissible' | 'width'>> & Pick<DialogOptions, 'allowClose'>
	resolve: (r: DialogResult<unknown>) => void
}

/** Confirms are rendered by `FF_DialogManager` via your `confirm` snippet - no body to write, just a string. */
export type ConfirmItem = {
	id: number
	message: LocalizedMessage
	title?: LocalizedMessage
	confirmLabel: LocalizedMessage
	cancelLabel: LocalizedMessage
	/** Style the confirm action as destructive. */
	danger: boolean
	resolve: (yes: boolean) => void
}

/** A single-text-input prompt, rendered by `FF_DialogManager` (built-in default or your `prompt` snippet). */
export type PromptItem = {
	id: number
	title?: LocalizedMessage
	label?: LocalizedMessage
	placeholder?: string
	initial: string
	confirmLabel: LocalizedMessage
	cancelLabel: LocalizedMessage
	/** Optional live hint under the field (e.g. a derived key preview). */
	hint?: (value: string) => string
	resolve: (value: string | null) => void
}

let _dialogs = $state<DialogItem[]>([])
let _confirms = $state<ConfirmItem[]>([])
let _prompts = $state<PromptItem[]>([])
let _nextId = 1

async function tryClose(d: DialogItem, result: DialogResult<unknown>) {
	if (!result.ok && d.options.allowClose) {
		const allowed = await d.options.allowClose()
		if (!allowed) return false
	}
	d.resolve(result)
	_dialogs = _dialogs.filter((x) => x.id !== d.id)
	return true
}

function normaliseResult<T>(arg: unknown): DialogResult<T> {
	if (arg === undefined) return { ok: false }
	if (typeof arg === 'object' && arg !== null && 'ok' in arg) {
		return arg as DialogResult<T>
	}
	return { ok: true, data: arg as T }
}

export const dialog = {
	get list(): readonly DialogItem[] {
		return _dialogs
	},
	get confirmList(): readonly ConfirmItem[] {
		return _confirms
	},
	get promptList(): readonly PromptItem[] {
		return _prompts
	},

	/** Open a dialog. Resolves when it closes. `body` is a snippet receiving `close(result?)`. */
	show<T = unknown>(
		body: Snippet<[DialogClose<T>]>,
		options: DialogOptions = {},
	): Promise<DialogResult<T>> {
		return new Promise<DialogResult<T>>((resolve) => {
			_dialogs = [
				..._dialogs,
				{
					id: _nextId++,
					body: body as Snippet<[DialogClose]>,
					options: {
						dismissible: options.dismissible ?? true,
						width: options.width ?? 'md',
						allowClose: options.allowClose,
					},
					resolve: resolve as (r: DialogResult<unknown>) => void,
				},
			]
		})
	},

	/**
	 * Yes/no confirmation, rendered via the manager's `confirm` snippet. Resolves a boolean.
	 * Labels accept a `LocalizedMessage` (a string, or a paraglide/i18next message fn).
	 */
	confirm(
		message: LocalizedMessage,
		opts: {
			title?: LocalizedMessage
			confirmLabel?: LocalizedMessage
			cancelLabel?: LocalizedMessage
			danger?: boolean
		} = {},
	): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			_confirms = [
				..._confirms,
				{
					id: _nextId++,
					message,
					title: opts.title,
					confirmLabel: opts.confirmLabel ?? 'Confirm',
					cancelLabel: opts.cancelLabel ?? 'Cancel',
					danger: opts.danger ?? false,
					resolve,
				},
			]
		})
	},

	/**
	 * Ask for a single text value. Resolves the (trimmed) string, or `null` if cancelled.
	 * Rendered via the manager's `prompt` snippet, or a built-in default.
	 */
	prompt(
		opts: {
			title?: LocalizedMessage
			label?: LocalizedMessage
			placeholder?: string
			initial?: string
			confirmLabel?: LocalizedMessage
			cancelLabel?: LocalizedMessage
			hint?: (value: string) => string
		} = {},
	): Promise<string | null> {
		return new Promise<string | null>((resolve) => {
			_prompts = [
				..._prompts,
				{
					id: _nextId++,
					title: opts.title,
					label: opts.label,
					placeholder: opts.placeholder,
					initial: opts.initial ?? '',
					confirmLabel: opts.confirmLabel ?? 'OK',
					cancelLabel: opts.cancelLabel ?? 'Cancel',
					hint: opts.hint,
					resolve,
				},
			]
		})
	},

	/** Internal (manager): resolve a prompt with a value (or null to cancel). */
	_resolvePrompt(id: number, value: string | null) {
		const p = _prompts.find((x) => x.id === id)
		if (!p) return
		p.resolve(value)
		_prompts = _prompts.filter((x) => x.id !== id)
	},

	/** Dismiss the topmost prompt (resolves null). */
	dismissTopPrompt() {
		const p = _prompts.at(-1)
		if (!p) return
		p.resolve(null)
		_prompts = _prompts.filter((x) => x.id !== p.id)
	},

	/** Internal (manager): resolve a dialog with an explicit result. */
	async _close(id: number, result: unknown) {
		const d = _dialogs.find((x) => x.id === id)
		if (!d) return
		await tryClose(d, normaliseResult(result))
	},

	/** Internal (manager): dismiss a specific dialog (Esc / backdrop / close button) - honours `dismissible` + `allowClose`. */
	async requestClose(id: number) {
		const d = _dialogs.find((x) => x.id === id)
		if (!d || !d.options.dismissible) return
		await tryClose(d, { ok: false })
	},

	/** Internal (manager): resolve a confirm. */
	_resolveConfirm(id: number, yes: boolean) {
		const c = _confirms.find((x) => x.id === id)
		if (!c) return
		c.resolve(yes)
		_confirms = _confirms.filter((x) => x.id !== id)
	},

	/** Dismiss the topmost dialog (honours `dismissible`). */
	async dismissTop() {
		const d = _dialogs.at(-1)
		if (!d || !d.options.dismissible) return
		await tryClose(d, { ok: false })
	},

	/** Dismiss the topmost confirm (resolves false). */
	dismissTopConfirm() {
		const c = _confirms.at(-1)
		if (!c) return
		c.resolve(false)
		_confirms = _confirms.filter((x) => x.id !== c.id)
	},

	/** Force-close everything (e.g. on full-page navigation). */
	closeAll() {
		for (const d of _dialogs) d.resolve({ ok: false })
		for (const c of _confirms) c.resolve(false)
		for (const p of _prompts) p.resolve(null)
		_dialogs = []
		_confirms = []
		_prompts = []
	},
}

/**
 * `use:ffAutofocus` - focus the first focusable element inside the node (after mount).
 * Put it on your dialog panel so keyboard users land inside it.
 */
export function ffAutofocus(node: HTMLElement) {
	queueMicrotask(() => {
		node
			.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]:not([tabindex="-1"])')
			?.focus()
	})
}
