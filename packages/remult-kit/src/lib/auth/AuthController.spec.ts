import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryDataProvider } from 'remult'

import { isError } from '$lib'
import { remultKit } from '$lib/api'

import { auth, AuthController } from '.'

describe('test auth controller', () => {
	let api: ReturnType<typeof remultKit>
	beforeEach(() => {
		// remult.dataProvider = new InMemoryDataProvider()
		// remult.context. = { setCookie: () => {} }
	})

	it('Invalid Demo User Fails', async () => {
		remultKit({
			dataProvider: new InMemoryDataProvider(),
			modules: [
				auth({
					providers: { demo: [{ name: 'Noam' }] },
				}),
				{
					name: 'test',
					initApi: async () => {
						try {
							await AuthController.signInDemo('Noam2')
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
