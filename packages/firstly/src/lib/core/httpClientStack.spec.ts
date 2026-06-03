import { afterEach, describe, expect, it, vi } from 'vitest'

import { stackHttpClient, withHeader } from './httpClientStack'

afterEach(() => vi.unstubAllGlobals())

describe('stackHttpClient', () => {
	it('applies middlewares outermost-first and reaches the base fetch', async () => {
		const seen: Headers[] = []
		vi.stubGlobal('fetch', (_input: RequestInfo | URL, init?: RequestInit) => {
			seen.push(new Headers(init?.headers))
			return Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(
			withHeader('x-a', () => 'A'),
			withHeader('x-b', () => 'B'),
		)
		const res = await client('/x')

		expect(await res.text()).toBe('ok')
		expect(seen[0].get('x-a')).toBe('A')
		expect(seen[0].get('x-b')).toBe('B')
	})

	it('withHeader skips when the value is empty', async () => {
		let received: Headers | undefined
		vi.stubGlobal('fetch', (_i: RequestInfo | URL, init?: RequestInit) => {
			received = new Headers(init?.headers)
			return Promise.resolve(new Response('ok'))
		})

		await stackHttpClient(withHeader('x-token', () => null))('/x')
		expect(received?.has('x-token')).toBe(false)
	})
})
