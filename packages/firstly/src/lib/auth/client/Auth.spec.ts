import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryDataProvider } from 'remult'

import { isError } from '$lib'
import { firstly } from '$lib/api'

import { auth } from '..'
import { AuthControllerServer } from '../AuthController.server'

describe('test auth controller', () => {
  let api: ReturnType<typeof firstly>
  beforeEach(() => {
    // remult.dataProvider = new InMemoryDataProvider()
    // remult.context. = { setCookie: () => {} }
  })

  it('Invalid Demo User Fails', async () => {
    firstly({
      dataProvider: new InMemoryDataProvider(),
      modules: [
        auth({
          providers: { demo: [{ name: 'Noam' }] },
        }),
        {
          name: 'test',
          initApi: async () => {
            try {
              await AuthControllerServer.signInDemo('Noam2')
              expect('Should never').toBe('be here (1)')
            } catch (error) {
              if (isError(error)) {
                expect(error.message).toBe(`Noam2 not found as demo account!`)
              } else {
                expect('Should never').toBe('be here (2)')
              }
            }
          },
        },
      ],
    })
  })
})
