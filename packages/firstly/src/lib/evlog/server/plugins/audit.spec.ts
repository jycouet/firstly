import { describe, expect, it, vi } from 'vitest'

import { InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogAudit } from '../../evlogEntities.js'
import { captureDataProvider } from '../dataProviderCapture.js'

async function withInMemoryRemult<T>(fn: () => Promise<T>): Promise<T> {
	const dp: DataProvider = new InMemoryDataProvider()
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await plugin.drain!({ event } as any)
			const rows = await remult.repo(EvlogAudit).find()
			expect(rows).toHaveLength(0)
		})
	})

	it('onRequestFinish emits a denied audit on 401 of /api/foo', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				createLogger: (init: any) => ({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					emit: (extra: any) => emitted.push({ ...init, ...extra }),
				}),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			event: { status: 401, path: '/api/refund', method: 'POST', userId: 'u9' } as any,
			durationMs: 5,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
		expect(emitted).toHaveLength(1)
		expect(emitted[0].audit.action).toBe('refund.invoke')
		expect(emitted[0].audit.outcome).toBe('denied')
		expect(emitted[0].audit.actor.id).toBe('u9')
		vi.doUnmock('evlog')
		vi.resetModules()
	})

	it('onRequestFinish does NOT emit on 200 status', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				createLogger: (init: any) => ({ emit: () => emitted.push(init) }),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			event: { status: 200, path: '/api/refund', method: 'POST' } as any,
			durationMs: 5,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
		expect(emitted).toHaveLength(0)
		vi.doUnmock('evlog')
		vi.resetModules()
	})

	it('onRequestFinish does NOT emit on 401 of non-/api path', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const emitted: any[] = []
		vi.resetModules()
		vi.doMock('evlog', async (orig) => {
			const mod = await orig<typeof import('evlog')>()
			return {
				...mod,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				createLogger: (init: any) => ({ emit: () => emitted.push(init) }),
			}
		})
		const { firstlyAuditPlugin } = await import('./audit.js')
		const p = firstlyAuditPlugin()
		await p.onRequestFinish!({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			event: { status: 401, path: '/login', method: 'POST' } as any,
			durationMs: 5,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
		expect(emitted).toHaveLength(0)
		vi.doUnmock('evlog')
		vi.resetModules()
	})
})
