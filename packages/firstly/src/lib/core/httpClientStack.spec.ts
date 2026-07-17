import { afterEach, describe, expect, it, vi } from 'vitest'

import { stackHttpClient, withHeader, withShortTermCache } from './httpClientStack'

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

describe('withShortTermCache', () => {
	it('dedupes identical GETs within the TTL and hands out clones', async () => {
		let calls = 0
		vi.stubGlobal('fetch', () => {
			calls++
			return Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(withShortTermCache({ ttlMs: 1000 }))
		const [a, b] = await Promise.all([client('/api/tasks'), client('/api/tasks')])

		expect(calls).toBe(1)
		expect(await a.text()).toBe('ok')
		expect(await b.text()).toBe('ok') // clones: both bodies readable
	})

	it('expires after the TTL', async () => {
		vi.useFakeTimers()
		let calls = 0
		vi.stubGlobal('fetch', () => {
			calls++
			return Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(withShortTermCache({ ttlMs: 1000 }))
		await client('/api/tasks')
		vi.advanceTimersByTime(1001)
		await client('/api/tasks')

		expect(calls).toBe(2)
		vi.useRealTimers()
	})

	it('caches remult read-only POSTs but not writes', async () => {
		let calls = 0
		vi.stubGlobal('fetch', () => {
			calls++
			return Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(withShortTermCache())
		await client('/api/tasks?__action=get', { method: 'POST', body: '{}' })
		await client('/api/tasks?__action=get', { method: 'POST', body: '{}' })
		expect(calls).toBe(1)

		await client('/api/tasks', { method: 'POST', body: '{}' })
		await client('/api/tasks', { method: 'POST', body: '{}' })
		expect(calls).toBe(3)
	})

	it('keys by body so different queries do not collide', async () => {
		const seen: string[] = []
		vi.stubGlobal('fetch', (_i: RequestInfo | URL, init?: RequestInit) => {
			seen.push(String(init?.body))
			return Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(withShortTermCache())
		await client('/api/tasks?__action=get', { method: 'POST', body: '{"a":1}' })
		await client('/api/tasks?__action=get', { method: 'POST', body: '{"a":2}' })
		expect(seen).toHaveLength(2)
	})

	it('evicts failed requests so the next call retries', async () => {
		let calls = 0
		vi.stubGlobal('fetch', () => {
			calls++
			return calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(new Response('ok'))
		})

		const client = stackHttpClient(withShortTermCache())
		await expect(client('/api/tasks')).rejects.toThrow('boom')
		const res = await client('/api/tasks')
		expect(await res.text()).toBe('ok')
		expect(calls).toBe(2)
	})
})
