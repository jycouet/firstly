import { toast as sonner } from 'svelte-sonner'

import type { LocalizedMessage } from '../core/FF_Validators.js'
import { resolveMessage } from '../core/FF_Validators.js'
import FF_ToastHtml from './FF_ToastHtml.svelte'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export type ToastOptions = {
	/**
	 * Bold heading shown above the description. Defaults per `kind`
	 * (e.g. `error` → "Error"). Pass to override.
	 */
	title?: LocalizedMessage
	/** ms before auto-dismiss (passed through to svelte-sonner). */
	duration?: number
	/** An action button. */
	action?: { label: LocalizedMessage; onClick: () => void }
}

/** Per-kind default heading, used when `opts.title` is omitted (and no manager wired one). */
const DEFAULT_TITLE: Record<ToastKind, string> = {
	success: 'Success',
	error: 'Error',
	info: 'Info',
	warning: 'Warning',
}

/**
 * Resolves the per-kind default title. `<FF_ToastManager>` overrides this (client-side) to read
 * your `<FF_Config>` `messages.toast` titles, so defaults become locale-aware. Until then (or with
 * no manager mounted) the English `DEFAULT_TITLE` above is used.
 */
let resolveDefaultTitle: (kind: ToastKind) => string = (kind) => DEFAULT_TITLE[kind]

/** @internal Wired by `<FF_ToastManager>` to bridge `<FF_Config>` titles into this module. */
export function _setToastTitleResolver(fn: (kind: ToastKind) => string): void {
	resolveDefaultTitle = fn
}

/** A svelte-sonner toast id. */
type ToastId = string | number

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message
	if (typeof err === 'string') return err
	if (err !== null && typeof err === 'object' && 'message' in err)
		return String((err as { message: unknown }).message)
	return String(err)
}

/**
 * Build a toast: the bold `title` (from `opts.title`, else the per-kind default)
 * is svelte-sonner's main message; `description` is the body, rendered as HTML.
 */
function build(kind: ToastKind, description: LocalizedMessage, opts?: ToastOptions): ToastId {
	const title = opts?.title !== undefined ? resolveMessage(opts.title) : resolveDefaultTitle(kind)
	return sonner[kind](title, {
		// svelte-sonner renders a component description as `<Description {...componentProps} />`
		description: FF_ToastHtml,
		componentProps: { html: resolveMessage(description) },
		duration: opts?.duration,
		action: opts?.action
			? { label: resolveMessage(opts.action.label), onClick: opts.action.onClick }
			: undefined,
	})
}

/**
 * firstly's toast - a `LocalizedMessage`-aware wrapper over svelte-sonner. Mount
 * `<FF_ToastManager>` once (it renders sonner's `<Toaster>`).
 *
 * The first argument is the **description** (the body) and **may contain HTML**.
 * A bold **title** sits above it; it defaults per kind (e.g. `error` → "Error") and
 * can be overridden via `opts.title`. The per-kind defaults are localizable through
 * `<FF_Config messages.toast>`. Labels accept a string OR a message function
 * (paraglide/i18next), resolved at call time.
 *
 * ```ts
 * toast.error('Could not save the quote')                  // title: "Error"
 * toast.success('Saved <b>3</b> rows', { title: 'Done 🎉' })
 * toast.fromError(err)                                      // error toast from any thrown value
 * ```
 */
export const toast = {
	success: (description: LocalizedMessage, opts?: ToastOptions): ToastId =>
		build('success', description, opts),
	error: (description: LocalizedMessage, opts?: ToastOptions): ToastId =>
		build('error', description, opts),
	info: (description: LocalizedMessage, opts?: ToastOptions): ToastId =>
		build('info', description, opts),
	warning: (description: LocalizedMessage, opts?: ToastOptions): ToastId =>
		build('warning', description, opts),
	/** Dispatch on `kind` (default `'info'`). */
	show: (description: LocalizedMessage, opts?: ToastOptions & { kind?: ToastKind }): ToastId =>
		build(opts?.kind ?? 'info', description, opts),
	/** Pull a message out of any thrown value and show an error toast. */
	fromError: (err: unknown, opts?: ToastOptions): ToastId =>
		build('error', errorMessage(err), opts),
	/** Dismiss a toast by id (or all, if omitted). */
	dismiss: (id?: ToastId): void => {
		sonner.dismiss(id)
	},
}
