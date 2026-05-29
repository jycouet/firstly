import { getContext, setContext } from 'svelte'
import type { Snippet } from 'svelte'

import type { LocalizedMessage } from '../core/FF_Validators.js'
import type { DialogConfirmArgs, DialogPromptArgs, DialogShellArgs } from './dialog.svelte.js'

/**
 * App-wide config for firstly's Svelte components, provided once via `<FF_Config>` and read by
 * components (e.g. `FF_DialogManager`) during init.
 *
 * It is **context-scoped**, so it is SSR-safe (no module-level mutable state shared across
 * requests) and nestable (a sub-tree can override). Pass message **functions** (paraglide /
 * i18next) for labels: they re-resolve on every render, so locale changes are picked up for free.
 *
 * Precedence everywhere is: explicit prop on the component > `<FF_Config>` > firstly built-in.
 */
export type FF_ConfigValue = {
	/** Default labels for firstly's built-in UI (dialog confirm / cancel / ok, ...). */
	messages?: {
		confirm?: LocalizedMessage
		cancel?: LocalizedMessage
		ok?: LocalizedMessage
	}
	/** Dialog skin: your own shell / confirm / prompt snippets (override the built-in defaults). */
	dialog?: {
		shell?: Snippet<[DialogShellArgs]>
		confirm?: Snippet<[DialogConfirmArgs]>
		prompt?: Snippet<[DialogPromptArgs]>
	}
}

const KEY = Symbol('ff-config')

/** firstly's fallback labels, used when neither a call-site label nor `<FF_Config>` provides one. */
const BUILTIN_MESSAGES = { confirm: 'Confirm', cancel: 'Cancel', ok: 'OK' } as const

/**
 * Provide config to descendants. Takes a **getter** (not a snapshot) so reads stay reactive -
 * `<FF_Config>` calls it with `() => ({ messages, dialog })` over its own props.
 */
export function setFFConfig(get: () => FF_ConfigValue): void {
	setContext(KEY, get)
}

/**
 * Read the nearest config, merged over firstly's built-ins. Call during component init; the
 * returned object exposes **getters**, so reading them in markup re-invokes the provider and
 * stays reactive (and locale-correct, since labels are message functions resolved at render).
 */
export function ffConfig() {
	const get = getContext<(() => FF_ConfigValue) | undefined>(KEY)
	return {
		get messages() {
			return { ...BUILTIN_MESSAGES, ...get?.().messages }
		},
		get dialog() {
			return get?.().dialog ?? {}
		},
	}
}
