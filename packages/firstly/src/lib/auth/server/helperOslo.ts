import { sha256 } from '@oslojs/crypto/sha2'
import { encodeBase32LowerCase, encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding'

export function generateId() {
  // ID with 120 bits of entropy, or about the same as UUID v4.
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  const id = encodeBase32LowerCase(bytes)
  return id
}

export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const token = encodeBase64url(bytes)
  return token
}

export function encodeToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  return sessionId
}

export function generateAndEncodeToken() {
  return encodeToken(generateToken())
}

export function createDate(timeSpan_seconds: number, options?: { from?: Date }) {
  const from = options?.from ?? new Date()
  return new Date(from.getTime() + timeSpan_seconds * 1000)
}