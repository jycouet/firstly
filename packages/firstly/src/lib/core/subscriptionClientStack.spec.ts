import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SubscriptionClient, SubscriptionClientConnection } from 'remult'

import { stackSubscriptionClient, withTabSharing } from './subscriptionClientStack'

// ---- fakes: BroadcastChannel + navigator.locks (exclusive queue) ----

class FakeBroadcastChannel {
	static registry = new Map<string, Set<FakeBroadcastChannel>>()
	onmessage: ((e: { data: unknown }) => void) | null = null
	#closed = false
	constructor(public name: string) {
		let peers = FakeBroadcastChannel.registry.get(name)
		if (!peers) FakeBroadcastChannel.registry.set(name, (peers = new Set()))
		peers.add(this)
	}
	postMessage(data: unknown) {
		for (const peer of FakeBroadcastChannel.registry.get(this.name) ?? []) {
			if (peer === this || peer.#closed) continue
			queueMicrotask(() => peer.onmessage?.({ data }))
		}
	}
	close() {
		this.#closed = true
		FakeBroadcastChannel.registry.get(this.name)?.delete(this)
	}
}

function fakeLocks() {
	const queues = new Map<string, Promise<unknown>>()
	return {
		request(name: string, _opts: unknown, cb: () => Promise<unknown>) {
			const tail = queues.get(name) ?? Promise.resolve()
			const p = tail.then(() => cb())
			queues.set(
				name,
				p.catch(() => {}),
			)
			return p
		},
	}
}

// Drain microtasks so bus messages and lock handoffs settle.
const flush = async (n = 20) => {
	for (let i = 0; i < n; i++) await Promise.resolve()
}

type FakeReal = {
	client: SubscriptionClient
	opened: number
	subscribed: string[]
	unsubscribed: string[]
	fireReconnect: () => void
	publish: (channel: string, data: unknown) => void
}

function fakeRealClient(): FakeReal {
	const handlers = new Map<string, (data: unknown) => void>()
	let onReconnectRef: VoidFunction = () => {}
	const state: FakeReal = {
		opened: 0,
		subscribed: [],
		unsubscribed: [],
		fireReconnect: () => onReconnectRef(),
		publish: (channel, data) => handlers.get(channel)?.(data),
		client: {
			async openConnection(onReconnect) {
				state.opened++
				onReconnectRef = onReconnect
				const connection: SubscriptionClientConnection = {
					close() {},
					async subscribe(channel, handler) {
						state.subscribed.push(channel)
						handlers.set(channel, handler)
						return () => {
							state.unsubscribed.push(channel)
							handlers.delete(channel)
						}
					},
				}
				return connection
			},
		},
	}
	return state
}

beforeEach(() => {
	FakeBroadcastChannel.registry.clear()
	vi.stubGlobal('window', {})
	vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
	vi.stubGlobal('navigator', { locks: fakeLocks() })
})

afterEach(() => vi.unstubAllGlobals())

describe('stackSubscriptionClient', () => {
	it('with a middleware, composes around the base client', async () => {
		const real = fakeRealClient()
		const client = stackSubscriptionClient((_next) => real.client)
		await client.openConnection(() => {})
		expect(real.opened).toBe(1)
	})
})

describe('withTabSharing', () => {
	it('falls back to the bare client when BroadcastChannel is unavailable', () => {
		vi.stubGlobal('BroadcastChannel', undefined)
		const real = fakeRealClient()
		expect(withTabSharing()(real.client)).toBe(real.client)
	})

	it('leader opens one real connection and fans messages out to followers', async () => {
		const real = fakeRealClient()
		const shared = withTabSharing()(real.client)

		const tab1 = await shared.openConnection(() => {})
		const tab2 = await shared.openConnection(() => {})
		await flush()

		const got1: unknown[] = []
		const got2: unknown[] = []
		await tab1.subscribe('news', (m) => got1.push(m), () => {})
		await tab2.subscribe('news', (m) => got2.push(m), () => {})
		await flush()

		expect(real.opened).toBe(1)
		expect(real.subscribed).toEqual(['news'])

		real.publish('news', 'hello')
		await flush()
		expect(got1).toEqual(['hello'])
		expect(got2).toEqual(['hello'])
	})

	it('refcounts interest: real unsubscribe only when the last tab leaves', async () => {
		const real = fakeRealClient()
		const shared = withTabSharing()(real.client)

		const tab1 = await shared.openConnection(() => {})
		const tab2 = await shared.openConnection(() => {})
		await flush()

		const un1 = await tab1.subscribe('news', () => {}, () => {})
		const un2 = await tab2.subscribe('news', () => {}, () => {})
		await flush()

		un2()
		await flush()
		expect(real.unsubscribed).toEqual([])

		un1()
		await flush()
		expect(real.unsubscribed).toEqual(['news'])
	})

	it('leader handoff: follower takes over, re-subscribes, and resyncs via onReconnect', async () => {
		const real = fakeRealClient()
		const shared = withTabSharing()(real.client)

		const tab1 = await shared.openConnection(() => {})
		let tab2Reconnects = 0
		const tab2 = await shared.openConnection(() => tab2Reconnects++)
		await flush()

		await tab2.subscribe('news', () => {}, () => {})
		await flush()
		expect(real.subscribed).toEqual(['news'])

		tab1.close()
		await flush(50)

		// tab2 became leader: opened its own real connection + re-subscribed its channel
		expect(real.opened).toBe(2)
		expect(real.subscribed).toEqual(['news', 'news'])
		// and resynced its liveQueries (it was riding the dead leader's connection)
		expect(tab2Reconnects).toBe(1)
	})

	it('real SSE reconnect fans onReconnect out to every tab', async () => {
		const real = fakeRealClient()
		const shared = withTabSharing()(real.client)

		let leaderReconnects = 0
		let followerReconnects = 0
		await shared.openConnection(() => leaderReconnects++)
		await shared.openConnection(() => followerReconnects++)
		await flush()

		real.fireReconnect()
		await flush()

		expect(leaderReconnects).toBe(1)
		expect(followerReconnects).toBe(1)
	})
})
