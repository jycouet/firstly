import { createHash, randomBytes } from 'node:crypto'

export function newRawToken(prefix: string): string {
	return prefix + randomBytes(32).toString('base64url')
}

export function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex')
}

export function tokenHint(raw: string, prefix: string): string {
	return raw.slice(0, prefix.length + 8)
}
