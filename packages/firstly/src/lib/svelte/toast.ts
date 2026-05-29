import { toast as sonner } from 'svelte-sonner'

import type { LocalizedMessage } from '../core/FF_Validators.js'
import { resolveMessage } from '../core/FF_Validators.js'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export type ToastOptions = {
	/** Secondary line under the message. */
	description?: LocalizedMessage
	/** ms before auto-dismiss (passed through to svelte-sonner). */
	duration?: number
	/** An action button. */
	action?: { label: LocalizedMessage; onClick: () => void }
}

/** A svelte-sonner toast id. */
type ToastId = string | number

function toSonner(opts?: ToastOptions) {
	// Return undefined when there's nothing to forward, so a bare `toast.x(msg)` (and `show`'s
	// internal `kind`-only opts) calls sonner with no data object.
	if (!opts || (opts.description === undefined && opts.duration === undefined && !opts.action)) {
		return undefined
	}
	return {
		description: opts.description !== undefined ? resolveMessage(opts.description) : undefined,
		duration: opts.duration,
		action: opts.action
			? { label: resolveMessage(opts.action.label), onClick: opts.action.onClick }
			: undefined,
	}
}

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message
	if (typeof err === 'string') return err
	if (err !== null && typeof err === 'object' && 'message' in err)
		return String((err as { message: unknown }).message)
	return String(err)
}

/**
 * firstly's toast - a thin, `LocalizedMessage`-aware wrapper over svelte-sonner. Mount
 * `<FF_ToastManager>` once (it renders sonner's `<Toaster>`). Labels accept a string OR a
 * message function (paraglide/i18next), resolved at call time (a toast is ephemeral, so no
 * need to re-resolve on locale change). `confirmRemove` uses `fromError` on a failed delete.
 */
export const toast = {
	success: (message: LocalizedMessage, opts?: ToastOptions): ToastId =>
		sonner.success(resolveMessage(message), toSonner(opts)),
	error: (message: LocalizedMessage, opts?: ToastOptions): ToastId =>
		sonner.error(resolveMessage(message), toSonner(opts)),
	info: (message: LocalizedMessage, opts?: ToastOptions): ToastId =>
		sonner.info(resolveMessage(message), toSonner(opts)),
	warning: (message: LocalizedMessage, opts?: ToastOptions): ToastId =>
		sonner.warning(resolveMessage(message), toSonner(opts)),
	/** Dispatch on `kind` (default `'info'`). */
	show: (message: LocalizedMessage, opts?: ToastOptions & { kind?: ToastKind }): ToastId =>
		toast[opts?.kind ?? 'info'](message, opts),
	/** Pull a message out of any thrown value and show an error toast. */
	fromError: (err: unknown, opts?: ToastOptions): ToastId =>
		sonner.error(errorMessage(err), toSonner(opts)),
	/** Dismiss a toast by id (or all, if omitted). */
	dismiss: (id?: ToastId): void => {
		sonner.dismiss(id)
	},
}
