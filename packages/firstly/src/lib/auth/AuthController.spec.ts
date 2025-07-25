import { beforeEach, describe, expect, it } from 'vitest'

import { EntityError, InMemoryDataProvider, remult, repo, type UserInfo } from 'remult'
import { TestApiDataProvider } from 'remult/server'

import { FF_Role } from '../internals'
import { firstly, ModuleFF } from '../server'
import { AuthController } from './AuthController'
import { FFAuthUser } from './Entities'
import { AuthControllerServer } from './server/AuthController.server'
import { auth } from './server/module'

const userAdmin: UserInfo = {
	id: '1',
	name: 'plop',
	roles: [FF_Role.FF_Role_Admin],
	session: { id: '1', expiresAt: new Date(Date.now() + 10000) },
	theme: 'daisy',
}

describe('demo', () => {
	beforeEach(async () => {})

	it('Invalid Demo User', async () => {
		firstly({
			dataProvider: new InMemoryDataProvider(),
			modulesFF: [
				auth({
					providers: { demo: [{ name: 'Noam' }] },
				}),
				new ModuleFF({
					name: 'test',
					initApi: async () => {
						try {
							await AuthControllerServer.signInDemo('Noam2')
							expect('Should never').toBe('be here (1)')
						} catch (error) {
							if (error instanceof EntityError) {
								expect(error.message).toBe(`Noam2 not found as demo account!`)
							} else {
								expect('Should never').toBe('be here (2)')
							}
						}
					},
				}),
			],
		})
	})

	it('valid Demo User', async () => {
		const api = firstly({
			modulesFF: [
				auth({
					providers: { demo: [{ name: 'Noam' }] },
				}),
			],
		})
		api.withRemult(undefined, async () => {
			const dp = new InMemoryDataProvider()
			remult.dataProvider = dp
			const res = await AuthController.signInDemo('Noam')
			expect(res.message).toBe(`You're in with demo account!`)
			expect(res.user!.name).toBe('Noam')

			remult.dataProvider = TestApiDataProvider({ dataProvider: dp })
			try {
				await repo(FFAuthUser).count()
				expect('Should never').toBe('be here')
			} catch (error) {
				if (error instanceof EntityError) {
					expect(error.message).toBe('Forbidden')
				}
			}

			remult.user = userAdmin
			expect(await repo(FFAuthUser).count()).toBe(1)
		})
	})
})
