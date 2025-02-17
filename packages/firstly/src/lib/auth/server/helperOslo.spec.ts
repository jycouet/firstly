import { describe, expect, it } from 'vitest'

import { encodeToken, generateId, generateToken } from './helperOslo'

describe('generateId', () => {
  it('should generate a valid id', () => {
    const id = generateId()
    expect(id).toBeDefined()
    expect(id.length).toBe(24)
  })
})

describe('generateToken', () => {
  it('should generate a valid token', () => {
    const token = generateToken()
    expect(token).toBeDefined()
    expect(token.length).toBe(24)
  })
})

describe('encodeToken', () => {
  it('should generate a valid token', () => {
    const token = generateToken()
    const sessionId = encodeToken(token)
    expect(sessionId).toBeDefined()
    expect(sessionId.length).toBe(64)
  })
})
