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

export type EmailMessages = {
	/** Returned when the value doesn't match the basic email shape regex. */
	invalid?: string
	/** Returned when the domain is malformed (`..`, leading/trailing dot, missing TLD). */
	invalidDomain?: string
	/** Returned when the domain is on the blocked list (`example.com`, `test.com`, ...). */
	blockedDomain?: string
	/** Returned when the TLD is on the blocked list (`.test`, `.example`, `.invalid`, ...). */
	blockedTld?: string
}

export type ValidatorMessages = {
	email?: EmailMessages
}

const DEFAULT_EMAIL_MESSAGES: Required<EmailMessages> = {
	invalid: 'Invalid email',
	invalidDomain: 'Invalid domain',
	blockedDomain: 'Test/example email not accepted',
	blockedTld: 'Test/example TLD not accepted',
}

/**
 * Build a project-localized set of validators. Override any subset of
 * messages; defaults are English.
 *
 * Each validator group exposes two members:
 * - `checkXxx(value)` - pure function, returns `true` on valid or a localized
 *   error message string. Use directly in UI for live inline feedback.
 * - `xxx` - a Remult `Validator` wrapping the same `checkXxx`. Use as
 *   `@Fields.string({ validate: app.email })`.
 *
 * ```ts
 * // src/lib/App_Validators.ts (typical kimbia-style French project)
 * import { createValidators } from 'firstly'
 *
 * export const App_Validators = createValidators({
 *   email: {
 *     invalid: 'Email invalide',
 *     invalidDomain: 'Domaine invalide',
 *     blockedDomain: 'Email de test/exemple non accepté',
 *     blockedTld: 'TLD de test/exemple non accepté',
 *   },
 * })
 *
 * // usage:
 * @Fields.string({ validate: App_Validators.email })
 * email = ''
 *
 * // live UI feedback:
 * const verdict = App_Validators.checkEmail(typed)
 * if (verdict !== true) showInlineError(verdict)
 * ```
 */
export function createValidators(messages: ValidatorMessages = {}) {
	const m: Required<EmailMessages> = { ...DEFAULT_EMAIL_MESSAGES, ...messages.email }

	function checkEmail(value: string): true | string {
		if (value === '') return true
		if (!EMAIL_SHAPE_RE.test(value)) return m.invalid
		const at = value.lastIndexOf('@')
		const domain = value.slice(at + 1).toLowerCase()
		if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
			return m.invalidDomain
		}
		if (BLOCKED_EMAIL_DOMAINS.has(domain)) return m.blockedDomain
		const tld = domain.split('.').pop() ?? ''
		if (BLOCKED_EMAIL_TLDS.has(tld)) return m.blockedTld
		if (!domain.includes('.') || tld.length < 2) return m.invalidDomain
		return true
	}

	return {
		checkEmail,
		email: createValueValidator(checkEmail, m.invalid),
	}
}

/**
 * Default English validators. For a localized variant, build your own with
 * `createValidators(messages)` and import that one in your project instead.
 */
export const FF_Validators = createValidators()

/** Convenience direct export of `FF_Validators.checkEmail` for ad-hoc use. */
export const checkEmail = FF_Validators.checkEmail
