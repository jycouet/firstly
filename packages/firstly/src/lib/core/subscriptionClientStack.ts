import {
	remult,
	type SubscriptionClient,
	type SubscriptionClientConnection,
	type Unsubscribe,
} from 'remult'

export type SubscriptionClientMiddleware = (next: SubscriptionClient) => SubscriptionClient

/**
 * Compose a `SubscriptionClient` from middlewares, with `directSseSubscriptionClient`
 * at the bottom of the stack. With no middlewares, you get the bare direct SSE client.
 *
 * ```ts
 * remult.apiClient.subscriptionClient = stackSubscriptionClient(withTabSharing())
 * ```
 */
export function stackSubscriptionClient(
	...middlewares: SubscriptionClientMiddleware[]
): SubscriptionClient {
	return middlewares.reduceRight<SubscriptionClient>(
		(next, mw) => mw(next),
		directSseSubscriptionClient(),
	)
}

const BUS_NAME = 'ff-sse-bus'
const LOCK_NAME = 'ff-sse-leader'

type BusMessage =
	| { type: 'leader:hello' }
	| { type: 'reconnect' }
	| { type: 'follower:channels'; tabId: string; channels: string[] }
	| { type: 'follower:subscribe'; tabId: string; channel: string }
	| { type: 'follower:unsubscribe'; tabId: string; channel: string }
	| { type: 'follower:bye'; tabId: string }
	| { type: 'message'; channel: string; data: unknown }

/**
 * Middleware that shares ONE real SSE connection across all tabs of the same origin.
 *
 * Why: the browser's HTTP/1.1 ~6-connections-per-domain limit. With one EventSource
 * per tab, opening 5+ tabs starves all other HTTP requests on the domain.
 *
 * How: `navigator.locks` elects a single leader tab. The leader opens the underlying
 * (next) `SubscriptionClient` and forwards every channel message over a
 * `BroadcastChannel` to follower tabs. Followers ask the leader to (un)subscribe
 * the channels they care about; the leader refcounts interest per tab. On leader
 * death (close/refresh), the lock is released and the next tab takes over,
 * re-subscribing every channel any surviving tab still cares about.
 *
 * liveQuery support: a leader handoff and a real SSE reconnect both fan out a
 * `reconnect` signal so EVERY tab fires its own `onReconnect`. Remult's
 * LiveQueryClient then re-runs each query (refetch + resubscribe), covering
 * messages lost in the gap. Plain `SubscriptionChannel` fanout works too, with the
 * usual SSE semantics (no replay of messages missed during a reconnect).
 */
export function withTabSharing(): SubscriptionClientMiddleware {
	return (next) => {
		if (
			typeof window === 'undefined' ||
			typeof BroadcastChannel === 'undefined' ||
			typeof navigator === 'undefined' ||
			!('locks' in navigator)
		) {
			return next
		}

		return {
			openConnection(onReconnect) {
				return Promise.resolve(createSharedConnection(next, onReconnect))
			},
		}
	}
}

function createSharedConnection(
	realClient: SubscriptionClient,
	onReconnect: VoidFunction,
): SubscriptionClientConnection {
	const tabId =
		typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2)
	const localHandlers = new Map<string, Set<(message: unknown) => void>>()
	const bus = new BroadcastChannel(BUS_NAME)
	let isLeader = false
	// True once another tab's leader served us - a later takeover is then a handoff.
	let sawRemoteLeader = false
	let leaderConnection: SubscriptionClientConnection | undefined
	// Leader state: real subscription per channel + which tabs still want it.
	const realSubs = new Map<string, Promise<Unsubscribe>>()
	const interest = new Map<string, Set<string>>()
	let closed = false
	let closeResolver: (() => void) | undefined

	const dispatchLocally = (channel: string, message: unknown) => {
		const handlers = localHandlers.get(channel)
		if (handlers) handlers.forEach((h) => h(message))
	}

	const addInterest = (channel: string, forTab: string) => {
		let tabs = interest.get(channel)
		if (!tabs) interest.set(channel, (tabs = new Set()))
		tabs.add(forTab)
	}

	const ensureRealSubscribed = async (channel: string, forTab: string) => {
		if (!isLeader || !leaderConnection) return
		addInterest(channel, forTab)
		if (realSubs.has(channel)) return
		const promise = leaderConnection.subscribe(
			channel,
			(data) => {
				dispatchLocally(channel, data)
				bus.postMessage({ type: 'message', channel, data } satisfies BusMessage)
			},
			(err) => {
				console.error('[withTabSharing] channel error', channel, err)
			},
		)
		realSubs.set(channel, promise)
		await promise
	}

	const dropInterest = (channel: string, forTab: string) => {
		if (!isLeader) return
		const tabs = interest.get(channel)
		if (!tabs) return
		tabs.delete(forTab)
		if (tabs.size > 0) return
		interest.delete(channel)
		const sub = realSubs.get(channel)
		if (sub) {
			realSubs.delete(channel)
			sub.then((unsub) => unsub()).catch(() => {})
		}
	}

	const dropTab = (forTab: string) => {
		if (!isLeader) return
		for (const channel of [...interest.keys()]) {
			dropInterest(channel, forTab)
		}
	}

	bus.onmessage = async (e) => {
		const msg = e.data as BusMessage
		switch (msg.type) {
			case 'message':
				dispatchLocally(msg.channel, msg.data)
				break
			case 'reconnect':
				if (!isLeader) onReconnect()
				break
			case 'follower:subscribe':
				if (isLeader) await ensureRealSubscribed(msg.channel, msg.tabId)
				break
			case 'follower:unsubscribe':
				dropInterest(msg.channel, msg.tabId)
				break
			case 'follower:bye':
				dropTab(msg.tabId)
				break
			case 'follower:channels':
				if (isLeader) {
					for (const ch of msg.channels) await ensureRealSubscribed(ch, msg.tabId)
				}
				break
			case 'leader:hello':
				if (!isLeader) {
					const isHandoff = sawRemoteLeader
					sawRemoteLeader = true
					bus.postMessage({
						type: 'follower:channels',
						tabId,
						channels: [...localHandlers.keys()],
					} satisfies BusMessage)
					// New leader means the previous SSE connection died with our
					// subscriptions on it - resync liveQueries.
					if (isHandoff) onReconnect()
				}
				break
		}
	}

	navigator.locks
		.request(LOCK_NAME, { mode: 'exclusive' }, async () => {
			if (closed) return
			try {
				leaderConnection = await realClient.openConnection(() => {
					// Real SSE reconnected: resync every tab, not just the leader.
					onReconnect()
					bus.postMessage({ type: 'reconnect' } satisfies BusMessage)
				})
				isLeader = true
				for (const ch of localHandlers.keys()) {
					await ensureRealSubscribed(ch, tabId)
				}
				bus.postMessage({ type: 'leader:hello' } satisfies BusMessage)
				// We were riding a dead leader's connection - resync our own queries.
				if (sawRemoteLeader) onReconnect()
			} catch (err) {
				console.error('[withTabSharing] failed to become leader', err)
				return
			}
			await new Promise<void>((resolve) => {
				if (closed) resolve()
				closeResolver = resolve
			})
		})
		.catch((err) => {
			console.error('[withTabSharing] lock request failed', err)
		})

	return {
		close() {
			if (closed) return
			closed = true
			try {
				bus.postMessage({ type: 'follower:bye', tabId } satisfies BusMessage)
				bus.close()
			} catch {
				// bus may already be gone (tab teardown)
			}
			if (leaderConnection) {
				try {
					leaderConnection.close()
				} catch {
					// best effort
				}
			}
			closeResolver?.()
		},
		async subscribe(channel, onMessage, _onError) {
			let handlers = localHandlers.get(channel)
			if (!handlers) {
				handlers = new Set()
				localHandlers.set(channel, handlers)
			}
			handlers.add(onMessage)

			if (isLeader) {
				await ensureRealSubscribed(channel, tabId)
			} else {
				bus.postMessage({ type: 'follower:subscribe', tabId, channel } satisfies BusMessage)
			}

			return () => {
				const set = localHandlers.get(channel)
				if (!set) return
				set.delete(onMessage)
				if (set.size === 0) {
					localHandlers.delete(channel)
					if (isLeader) {
						dropInterest(channel, tabId)
					} else {
						bus.postMessage({
							type: 'follower:unsubscribe',
							tabId,
							channel,
						} satisfies BusMessage)
					}
				}
			}
		},
	}
}

/**
 * Minimal direct SSE-based `SubscriptionClient` - mirrors Remult's internal
 * `SseSubscriptionClient`. Inlined because Remult does not publicly export it.
 */
export function directSseSubscriptionClient(): SubscriptionClient {
	return {
		openConnection(onReconnect) {
			const channels = new Map<string, ((message: unknown) => void)[]>()
			let connectionId: string | undefined
			let source: EventSource | undefined
			let connected = false
			let retryCount = 0

			const baseUrl = remult.apiClient.url ?? '/api'
			const streamUrl = `${baseUrl}/stream`

			const post = async (path: string, body: unknown) => {
				const res = await fetch(`${streamUrl}/${path}`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				})
				return res.json().catch(() => null)
			}

			const subscribeOnServer = async (channel: string) => {
				if (!connectionId) return
				await post('subscribe', { channel, clientId: connectionId })
			}

			const open = (resolveOnce: (c: SubscriptionClientConnection) => void) => {
				if (source) source.close()
				source = new EventSource(streamUrl, { withCredentials: true })

				source.onmessage = (e) => {
					try {
						const msg = JSON.parse(e.data) as { channel: string; data: unknown }
						const listeners = channels.get(msg.channel)
						if (listeners) listeners.forEach((l) => l(msg.data))
					} catch (err) {
						console.error('[directSseSubscriptionClient] parse error', err)
					}
				}

				source.onerror = () => {
					source?.close()
					if (retryCount++ < 10) setTimeout(open, 500, resolveOnce)
				}

				source.addEventListener('connectionId', async (e) => {
					connectionId = (e as MessageEvent).data
					if (connected) {
						for (const ch of channels.keys()) await subscribeOnServer(ch)
						onReconnect()
					} else {
						connected = true
						resolveOnce(connection)
					}
				})
			}

			const connection: SubscriptionClientConnection = {
				close() {
					source?.close()
				},
				async subscribe(channel, handler, _onError) {
					let listeners = channels.get(channel)
					if (!listeners) {
						channels.set(channel, (listeners = []))
						await subscribeOnServer(channel)
					}
					listeners.push(handler)
					return () => {
						const idx = listeners!.indexOf(handler)
						if (idx >= 0) listeners!.splice(idx, 1)
						if (listeners!.length === 0) {
							channels.delete(channel)
							if (connectionId) {
								post('unsubscribe', { channel, clientId: connectionId }).catch(() => {})
							}
						}
					}
				},
			}

			return new Promise<SubscriptionClientConnection>((resolve) => open(resolve))
		},
	}
}
