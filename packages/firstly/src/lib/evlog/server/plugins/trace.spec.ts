import { describe, expect, it } from 'vitest'

import { InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogTrace, EvlogTraceQuery } from '../../evlogEntities.js'
import { captureDataProvider, resetCapturedDataProvider } from '../dataProviderCapture.js'
import { firstlyTracePlugin } from './trace.js'

async function withInMemory<T>(fn: () => Promise<T>): Promise<T> {
	const dp: DataProvider = new InMemoryDataProvider()
	resetCapturedDataProvider() // first-capture-wins: each test binds its own provider
	captureDataProvider(dp)
	return withRemult(
		async () => {
			remult.repo(EvlogTrace)
			remult.repo(EvlogTraceQuery)
			return fn()
		},
		{ dataProvider: dp },
	)
}

describe('firstlyTracePlugin', () => {
	it('drain inserts an EvlogTrace row for a non-audit event', async () => {
		await withInMemory(async () => {
			const plugin = firstlyTracePlugin()
			const event = {
				timestamp: new Date('2026-05-05T10:00:00Z').toISOString(),
				level: 'info',
				path: '/api/tasks',
				method: 'GET',
				status: 200,
				duration: '12ms',
				module: 'tasks',
			}

			await plugin.drain!({ event } as any)
			const traces = await remult.repo(EvlogTrace).find()
			expect(traces).toHaveLength(1)
			expect(traces[0].path).toBe('/api/tasks')
			expect(traces[0].duration).toBe(12)
			expect(traces[0].status).toBe(200)
		})
	})

	it('drain skips audit-bearing events', async () => {
		await withInMemory(async () => {
			const plugin = firstlyTracePlugin()
			const event = {
				timestamp: new Date().toISOString(),
				audit: {
					action: 'tasks.create',
					actor: { type: 'user', id: 'u1' },
					outcome: 'success',
				},
			}

			await plugin.drain!({ event } as any)
			expect(await remult.repo(EvlogTrace).find()).toHaveLength(0)
		})
	})

	it('drain inserts EvlogTraceQuery rows for db_queries[]', async () => {
		await withInMemory(async () => {
			const plugin = firstlyTracePlugin()
			const event = {
				timestamp: new Date('2026-05-05T10:00:00Z').toISOString(),
				level: 'info',
				path: '/api/tasks',
				method: 'GET',
				status: 200,
				db_queries: [
					{ sql: 'select * from tasks where id = ?', duration: 3, args: ['t1'] },
					{ sql: 'update tasks set completed = ? where id = ?', duration: 7, args: [true, 't1'] },
				],
			}

			await plugin.drain!({ event } as any)
			const traces = await remult.repo(EvlogTrace).find()
			const queries = await remult.repo(EvlogTraceQuery).find()
			expect(traces).toHaveLength(1)
			expect(queries).toHaveLength(2)
			expect(queries[0].traceId).toBe(traces[0].id)
			expect(queries[0].sql).toBe('select * from tasks where id = ?')
			expect(queries[1].duration).toBe(7)
			// db_queries should not be persisted on the trace's event JSON

			expect((traces[0].event as any).db_queries).toBeUndefined()
		})
	})

	it('drain skips paths matched by skipPaths (exact + prefix)', async () => {
		await withInMemory(async () => {
			const plugin = firstlyTracePlugin({
				skipPaths: ['/api/health', '/api/_internal*'],
			})
			for (const path of ['/api/health', '/api/_internal/foo']) {
				await plugin.drain!({
					event: { timestamp: new Date().toISOString(), path } as any,
				})
			}
			expect(await remult.repo(EvlogTrace).find()).toHaveLength(0)
		})
	})
})
