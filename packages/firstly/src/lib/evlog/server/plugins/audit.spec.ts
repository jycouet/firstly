import { describe, expect, it, vi } from 'vitest'

import { InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogAudit } from '../../evlogEntities.js'
import { captureDataProvider, resetCapturedDataProvider } from '../dataProviderCapture.js'

async function withInMemoryRemult<T>(fn: () => Promise<T>): Promise<T> {
	const dp: DataProvider = new InMemoryDataProvider()
	resetCapturedDataProvider() // first-capture-wins: each test binds its own provider
	captureDataProvider(dp)
	return withRemult(
		async () => {
			remult.repo(EvlogAudit)
			return fn()
		},
		{ dataProvider: dp },
	)
}

describe('firstlyAuditPlugin', () => {
	it('drain inserts an EvlogAudit row when event has audit field', async () => {
		await withInMemoryRemult(async () => {
			const { firstlyAuditPlugin } = await import('./audit.js')
			const plugin = firstlyAuditPlugin()
			const event = {
				timestamp: new Date('2026-05-05T10:00:00Z').toISOString(),
				module: 'tasks',
				audit: {
					action: 'tasks.create',
					actor: { type: 'user', id: 'u1' },
					target: { type: 'tasks', id: 't1' },
					outcome: 'success',
					context: { traceId: 'trace-abc' },
				},
			}

			await plugin.drain!({ event } as any)
			const rows = await remult.repo(EvlogAudit).find()
			expect(rows).toHaveLength(1)
			expect(rows[0].action).toBe('tasks.create')
			expect(rows[0].actorId).toBe('u1')
			expect(rows[0].traceId).toBe('trace-abc')
			expect(rows[0].outcome).toBe('success')
		})
	})

	it('drain inserts nothing when event has no audit field', async () => {
		await withInMemoryRemult(async () => {
			const { firstlyAuditPlugin } = await import('./audit.js')
			const plugin = firstlyAuditPlugin()
			const event = { timestamp: new Date().toISOString() }

			await plugin.drain!({ event } as any)
			const rows = await remult.repo(EvlogAudit).find()
			expect(rows).toHaveLength(0)
		})
	})

	it('onRequestFinish emits a denied audit on 401 of /api/foo', async () => {
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,

				createLogger: (init: any) => ({
					emit: (extra: any) => emitted.push({ ...init, ...extra }),
				}),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			status: 401,
			request: { path: '/api/refund', method: 'POST' },
			event: { userId: 'u9' } as any,
			durationMs: 5,
		} as any)
		expect(emitted).toHaveLength(1)
		expect(emitted[0].audit.action).toBe('refund.invoke')
		expect(emitted[0].audit.outcome).toBe('denied')
		expect(emitted[0].audit.actor.id).toBe('u9')
		vi.doUnmock('evlog')
		vi.resetModules()
	})

	it('onRequestFinish emits a denied audit even when the wide event was sampled out (event=null)', async () => {
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,

				createLogger: (init: any) => ({
					emit: (extra: any) => emitted.push({ ...init, ...extra }),
				}),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		// status/path/method live on the top-level RequestFinishContext, NOT on `event`,
		// and `event` is null when tail sampling drops the wide event. Must not crash.
		await p.onRequestFinish!({
			event: null,
			status: 401,
			request: { path: '/api/refund', method: 'POST' },
			durationMs: 5,
		} as any)
		expect(emitted).toHaveLength(1)
		expect(emitted[0].audit.action).toBe('refund.invoke')
		expect(emitted[0].audit.outcome).toBe('denied')
		expect(emitted[0].audit.actor.id).toBe('anonymous')
		expect(emitted[0].audit.actor.type).toBe('system')
		vi.doUnmock('evlog')
		vi.resetModules()
	})

	it('onRequestFinish does NOT emit on 200 status', async () => {
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,

				createLogger: (init: any) => ({ emit: () => emitted.push(init) }),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			status: 200,
			request: { path: '/api/refund', method: 'POST' },
			event: null,
			durationMs: 5,
		} as any)
		expect(emitted).toHaveLength(0)
		vi.doUnmock('evlog')
		vi.resetModules()
	})

	it('onRequestFinish does NOT emit on 401 of non-/api path', async () => {
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,

				createLogger: (init: any) => ({ emit: () => emitted.push(init) }),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			status: 401,
			request: { path: '/login', method: 'POST' },
			event: null,
			durationMs: 5,
		} as any)
		expect(emitted).toHaveLength(0)
		vi.doUnmock('evlog')
		vi.resetModules()
	})
})
