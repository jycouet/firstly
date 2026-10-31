import { InMemoryDataProvider } from 'remult'
import { afterEach, describe, expect, it } from 'vitest'

import { Task } from '../../modules/demo/Task.js'
import { repoClient, setRepoClientRequest } from './repoClient.js'

describe('repoClient', () => {
	afterEach(() => setRepoClientRequest(() => undefined))

	it('throws on the server without a request provider, never reads the server repo', () => {
		expect(() => repoClient(Task)).toThrow('handleRepoClient')
	})

	it('uses the provider of the request', async () => {
		const provider = new InMemoryDataProvider()
		setRepoClientRequest(() => provider)
		await repoClient(Task).insert({ title: 'a' })
		expect(await repoClient(Task).count()).toBe(1)
	})
})
