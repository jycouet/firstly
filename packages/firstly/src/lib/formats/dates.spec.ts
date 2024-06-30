import { describe, expect, it } from 'vitest'

import { dateISOToPlainDate, offsetedToPlainDate, plainDateCompare } from './dates'

describe('dateISOToPlainDate', () => {
  it('simple', () => {
    const result = dateISOToPlainDate(new Date('2024-04-01T22:00:00.000Z').toISOString())
    expect(result).toEqual('2024-04-01')
  })

  it('throw', () => {
    try {
      dateISOToPlainDate('2024-04-01')
      expect('To never be').toEqual('here')
    } catch (error) {
      expect(error).toMatchInlineSnapshot(
        `[Error: fn dateISOToPlainDate -> "2024-04-01" is not valid iso]`,
      )
    }
  })
})

describe('offsetedToPlainDate', () => {
  it('a 22h', () => {
    const result = offsetedToPlainDate(new Date('2024-04-01T22:00:00.000Z'))
    expect(result).toEqual('2024-04-02')
  })

  it('a 23h', () => {
    const result = offsetedToPlainDate(new Date('2024-03-04T23:00:00.000Z'))
    expect(result).toEqual('2024-03-05')
  })
})

describe('plainDateCompare', () => {
  it('1 simple true', () => {
    const result = plainDateCompare('2024-04-01', {
      $gte: '2024-04-01',
      $lt: '2024-04-02',
    })
    expect(result).toEqual(true)
  })

  it('2 simple false', () => {
    const result = plainDateCompare('2024-04-02', {
      $gt: '2024-04-01',
      $lt: '2024-04-02',
    })
    expect(result).toEqual(false)
  })

  it('3 fromExclusive', () => {
    const result = plainDateCompare('2024-04-01', {
      $gt: '2024-04-01',
      $lt: '2024-04-02',
    })
    expect(result).toEqual(false)
  })

  it('4 toInclusive', () => {
    const result = plainDateCompare('2024-04-02', {
      $gt: '2024-04-01',
      $lte: '2024-04-02',
    })
    expect(result).toEqual(true)
  })

  it('5 simple another year', () => {
    const result = plainDateCompare('2023-01-01', {
      $gt: '2024-04-01',
      $lt: '2024-04-02',
    })
    expect(result).toEqual(false)
  })

  it('5 wrong order', () => {
    const result = plainDateCompare('2024-04-02', {
      $gt: '2024-04-01',
      $lt: '2024-04-02',
    })
    expect(result).toEqual(false)
  })
})
