import type { Snippet } from 'svelte'

import type { LocalizedMessage } from '../core/FF_Validators.js'

/** Resolve a `LocalizedMessage` (literal, or a paraglide/i18next message fn) to a string. */
export const resolveMessage = (m: LocalizedMessage): string => (typeof m === 'function' ? m() : m)

/**
 * `dialog` - firstly's headless async dialog layer (Svelte 5 runes).
 *
 * It owns the *logic* only - the queue, the async resolution, the dismissal rules. It ships
 * **no markup**: mount `<FF_DialogManager>` once and give it your own `shell` / `confirm` /
 * `prompt` snippets, so each app styles the dialog however it likes (Tailwind or otherwise)
 * while sharing this behaviour. The dialog body is a snippet receiving a `close(result?)` callback.
 *
 * One result contract for all three: `show` / `confirm` / `prompt` resolve a `DialogResult`
 * (`{ ok: true, data } | { ok: false }`). `confirm` carries no `data` (read `.ok`); `prompt`'s
 * `data` is the trimmed string. So `{ ok }` always means "went through" and `ok: false` means
 * cancelled/dismissed - no per-method `boolean` / `null` special-casing.
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

/**
 * The unified result of every `dialog.*` call. `{ ok: true, data }` = went through (confirmed /
 * submitted), `{ ok: false }` = cancelled or dismissed. `confirm` uses `DialogResult<void>` (no
 * meaningful `data` - read `.ok`); `prompt` is `DialogResult<string>`; `show<T>` is `DialogResult<T>`.
 */
export type DialogResult<T = void> = { ok: true; data: T } | { ok: false }

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
	resolve: (r: DialogResult<void>) => void
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
	resolve: (r: DialogResult<string>) => void
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
	 * Yes/no confirmation, rendered via the manager's `confirm` snippet. Resolves a
	 * `DialogResult` - `{ ok: true }` when confirmed, `{ ok: false }` when cancelled/dismissed
	 * (no `data`). Same `{ ok }` shape as `show`/`prompt`, so `if ((await dialog.confirm(...)).ok)`.
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
	): Promise<DialogResult<void>> {
		return new Promise<DialogResult<void>>((resolve) => {
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
	 * Ask for a single text value. Resolves a `DialogResult<string>` - `{ ok: true, data }` with the
	 * (trimmed) value, or `{ ok: false }` if cancelled/dismissed. The `{ ok }` flag disambiguates
	 * "cancelled" from "submitted an empty string" (both would collapse to a falsy value otherwise).
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
	): Promise<DialogResult<string>> {
		return new Promise<DialogResult<string>>((resolve) => {
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
		p.resolve(value === null ? { ok: false } : { ok: true, data: value })
		_prompts = _prompts.filter((x) => x.id !== id)
	},

	/** Dismiss the topmost prompt (resolves `{ ok: false }`). */
	dismissTopPrompt() {
		const p = _prompts.at(-1)
		if (!p) return
		p.resolve({ ok: false })
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
		c.resolve(yes ? { ok: true, data: undefined } : { ok: false })
		_confirms = _confirms.filter((x) => x.id !== id)
	},

	/** Dismiss the topmost dialog (honours `dismissible`). */
	async dismissTop() {
		const d = _dialogs.at(-1)
		if (!d || !d.options.dismissible) return
		await tryClose(d, { ok: false })
	},

	/** Dismiss the topmost confirm (resolves `{ ok: false }`). */
	dismissTopConfirm() {
		const c = _confirms.at(-1)
		if (!c) return
		c.resolve({ ok: false })
		_confirms = _confirms.filter((x) => x.id !== c.id)
	},

	/** Force-close everything (e.g. on full-page navigation). All resolve `{ ok: false }`. */
	closeAll() {
		for (const d of _dialogs) d.resolve({ ok: false })
		for (const c of _confirms) c.resolve({ ok: false })
		for (const p of _prompts) p.resolve({ ok: false })
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
