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
 * Pure email check. Returns `true` on valid, or a short error message string
 * on invalid. Empty string is considered valid (so a default-empty optional
 * field doesn't fail validation).
 *
 * - Validates RFC-ish syntax via regex
 * - Rejects placeholder/test domains (`@example.com`, `*.test`, ...)
 *
 * Use directly in UI for live feedback, or wrap with `FF_Validators.email()`
 * for an entity-level Remult validator.
 */
export function checkEmail(value: string): true | string {
	if (value === '') return true
	if (!EMAIL_SHAPE_RE.test(value)) return 'Invalid email'
	const at = value.lastIndexOf('@')
	const domain = value.slice(at + 1).toLowerCase()
	if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
		return 'Invalid domain'
	}
	if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
		return 'Test/example email not accepted'
	}
	const tld = domain.split('.').pop() ?? ''
	if (BLOCKED_EMAIL_TLDS.has(tld)) {
		return 'Test/example TLD not accepted'
	}
	if (!domain.includes('.') || tld.length < 2) {
		return 'Invalid domain'
	}
	return true
}

/**
 * Strong email validator. Drop-in replacement for `Validators.email()` from
 * remult: allows empty string (so default-empty optional fields don't fail
 * validation), validates RFC syntax, and rejects placeholder/test domains.
 *
 * ```ts
 * @Fields.string({ validate: FF_Validators.email() })
 * email = ''
 * ```
 */
const email = createValueValidator(checkEmail, 'Invalid email')

export const FF_Validators = {
	email,
	checkEmail,
}
