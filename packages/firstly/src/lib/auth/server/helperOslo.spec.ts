import { describe, expect, it } from 'vitest'

import { createDate, encodeToken, generateId, generateToken } from './helperOslo'

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

describe('createDate', () => {
  it('should generate a valid date', () => {
    const date = createDate(0)
    expect(date).toBeDefined()
  })

  it('should generate a valid date 1 munite after', () => {
    const date = createDate(1, { from: new Date('2021-01-01') })
    expect(date).toMatchInlineSnapshot(`2021-01-01T00:00:01.000Z`)
  })
})
