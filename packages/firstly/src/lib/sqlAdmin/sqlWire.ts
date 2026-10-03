/**
 * Reversible wire encoding for SQL and its results. Not a secret (TLS + roles
 * are the security): it only keeps WAF rule sets from pattern-matching
 * `SELECT ... FROM` or Postgres error text in requests and responses.
 * The version suffix leaves room for another scheme if a WAF learns to decode this one.
 */
export const SQL_WIRE_PREFIX = 'ffsql1:'

const B64_PLUS = /\+/g
const B64_SLASH = /\//g
const B64_PAD = /=+$/
const B64URL_DASH = /-/g
const B64URL_UNDERSCORE = /_/g
/** Spreading a huge array into fromCharCode overflows the stack. */
const CHUNK = 0x8000

export const isSqlWire = (s: unknown): s is string =>
	typeof s === 'string' && s.startsWith(SQL_WIRE_PREFIX)

export function encodeSqlWire(s: string): string {
	const bytes = new TextEncoder().encode(s)
	let bin = ''
	for (let i = 0; i < bytes.length; i += CHUNK) {
		bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
	}
	const b64 = btoa(bin).replace(B64_PLUS, '-').replace(B64_SLASH, '_').replace(B64_PAD, '')
	return SQL_WIRE_PREFIX + b64
}

/** Anything without the prefix passes through: plain SQL keeps working. */
export function decodeSqlWire(s: string): string {
	if (!isSqlWire(s)) return s
	const b64 = s
		.slice(SQL_WIRE_PREFIX.length)
		.replace(B64URL_DASH, '+')
		.replace(B64URL_UNDERSCORE, '/')
	const bin = atob(b64)
	const bytes = new Uint8Array(bin.length)
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
	return new TextDecoder().decode(bytes)
}
