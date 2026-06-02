import { createValueValidator } from 'remult'

// RFC 2606 reserved test/example domains and obvious placeholders.
const BLOCKED_EMAIL_DOMAINS = new Set([
	'example.com',
	'example.net',
	'example.org',
	'test.com',
	'test.net',
	'test.org',
	'foo.com',
	'foo.bar',
	'bar.com',
	'baz.com',
	'domain.com',
	'mail.com',
	'localhost',
	'invalid',
])
const BLOCKED_EMAIL_TLDS = new Set(['test', 'example', 'invalid', 'localhost', 'local'])

const EMAIL_SHAPE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * A localized message. Either a literal string (single-locale projects) or a
 * function called at validation time (multi-locale projects - typically a
 * paraglide / i18next / lingui message function that resolves against the
 * current request's locale).
 */
export type LocalizedMessage = string | (() => string)

export type EmailMessages = {
	/** Returned when the value doesn't match the basic email shape regex. */
	invalid?: LocalizedMessage
	/** Returned when the domain is malformed (`..`, leading/trailing dot, missing TLD). */
	invalidDomain?: LocalizedMessage
	/** Returned when the domain is on the blocked list (`example.com`, `test.com`, ...). */
	blockedDomain?: LocalizedMessage
	/** Returned when the TLD is on the blocked list (`.test`, `.example`, `.invalid`, ...). */
	blockedTld?: LocalizedMessage
}

export type ValidatorMessages = {
	email?: EmailMessages
}

const DEFAULT_EMAIL_MESSAGES: Required<Record<keyof EmailMessages, string>> = {
	invalid: 'Invalid email',
	invalidDomain: 'Invalid domain',
	blockedDomain: 'Test/example email not accepted',
	blockedTld: 'Test/example TLD not accepted',
}

/** Resolve a `LocalizedMessage` (literal, or a paraglide/i18next/lingui message fn) to its current string value. */
export const resolveMessage = (m: LocalizedMessage): string => (typeof m === 'function' ? m() : m)

/**
 * Build a project-localized set of validators. Override any subset of
 * messages; defaults are English.
 *
 * Each message can be a literal string OR a function returning a string.
 * Function form is called at validation time (NOT at factory call time), so
 * pass paraglide / i18next / lingui message functions to get per-request
 * locale resolution:
 *
 * ```ts
 * import { createValidators } from 'firstly'
 * import * as m from '$lib/paraglide/messages'
 *
 * export const App_Validators = createValidators({
 *   email: {
 *     invalid:        () => m.email_invalid(),
 *     invalidDomain:  () => m.email_invalid_domain(),
 *     blockedDomain:  () => m.email_blocked_domain(),
 *     blockedTld:     () => m.email_blocked_tld(),
 *   },
 * })
 * ```
 *
 * Each validator group exposes two members:
 * - `checkXxx(value)` - pure function, returns `true` on valid or a
 *   localized error message string. Use for live UI feedback.
 * - `xxx` - a Remult `Validator` wrapping the same `checkXxx`. Use as
 *   `@Fields.string({ validate: app.email })`.
 */
export function createValidators(messages: ValidatorMessages = {}) {
	const m: Required<Record<keyof EmailMessages, LocalizedMessage>> = {
		...DEFAULT_EMAIL_MESSAGES,
		...messages.email,
	}

	function checkEmail(value: string): true | string {
		if (value === '') return true
		if (!EMAIL_SHAPE_RE.test(value)) return resolveMessage(m.invalid)
		const at = value.lastIndexOf('@')
		const domain = value.slice(at + 1).toLowerCase()
		if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
			return resolveMessage(m.invalidDomain)
		}
		if (BLOCKED_EMAIL_DOMAINS.has(domain)) return resolveMessage(m.blockedDomain)
		const tld = domain.split('.').pop() ?? ''
		if (BLOCKED_EMAIL_TLDS.has(tld)) return resolveMessage(m.blockedTld)
		if (!domain.includes('.') || tld.length < 2) return resolveMessage(m.invalidDomain)
		return true
	}

	return {
		checkEmail,
		// Pass a function so the per-request locale is resolved when the
		// validator actually fires, not when the validator is built.
		email: createValueValidator(checkEmail, () => resolveMessage(m.invalid)),
	}
}

/**
 * Default English validators. For localized messages, build your own with
 * `createValidators(messages)` and import that one in your project instead.
 */
export const FF_Validators = createValidators()

/** Convenience direct export of `FF_Validators.checkEmail` for ad-hoc use. */
export const checkEmail = FF_Validators.checkEmail
