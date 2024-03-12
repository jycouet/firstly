import { describe, expect, it } from 'vitest'

import { extractMailInfo } from './strings'

describe('extractMail', () => {
  it('simple', () => {
    const result = extractMailInfo('couou@fr.fr')
    expect(result).toMatchInlineSnapshot(`
      {
        "email": "couou@fr.fr",
        "firstName": "",
        "lastName": "COUOU",
      }
    `)
  })

  it('simple', () => {
    const result = extractMailInfo('yop.couou@fr.fr')
    expect(result).toMatchInlineSnapshot(`
      {
        "email": "yop.couou@fr.fr",
        "firstName": "Yop",
        "lastName": "COUOU",
      }
    `)
  })

  it('no @', () => {
    const result = extractMailInfo('cououcfr.fr')
    expect(result).toMatchInlineSnapshot(`null`)
  })

  it('with metadata', () => {
    const result = extractMailInfo('YO, titi <cououc@fr.fr>')
    expect(result).toMatchInlineSnapshot(`
      {
        "email": "cououc@fr.fr",
        "firstName": "Yo",
        "lastName": "TITI",
      }
    `)
  })

  it('with metadata', () => {
    const result = extractMailInfo('BB DD <B.D@O.com>')
    expect(result).toMatchInlineSnapshot(`
      {
        "email": "b.d@o.com",
        "firstName": "Bb",
        "lastName": "DD",
      }
    `)
  })
})
