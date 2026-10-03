/**
 * Reversible wire encoding for SQL and its results. Not a secret (TLS + roles
 * are the security): it only keeps WAF rule sets from pattern-matching
 * `SELECT ... FROM` or Postgres error text in requests and responses.
 * The version suffix leaves room for another scheme if a WAF learns to decode this one.
 */
export const SQL_WIRE_PREFIX = 'ffsql1:'

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
	return SQL_WIRE_PREFIX + btoa(bin)
}

/** Anything without the prefix passes through: plain SQL keeps working. */
export function decodeSqlWire(s: string): string {
	if (!isSqlWire(s)) return s
	const bin = atob(s.slice(SQL_WIRE_PREFIX.length))
	const bytes = new Uint8Array(bin.length)
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
	return new TextDecoder().decode(bytes)
}
