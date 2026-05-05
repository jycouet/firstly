import { describe, expect, it } from 'vitest'

import { InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery, Roles_Evlog } from './evlogEntities.js'
import { EvlogStatsController } from './EvlogStatsController.js'

async function seedAndAggregate(
	rows: {
		traces?: Partial<EvlogTrace>[]
		audits?: Partial<EvlogAudit>[]
		queries?: Partial<EvlogTraceQuery>[]
	},
	year = 2026,
	rowLimit?: number,
) {
	const dp: DataProvider = new InMemoryDataProvider()
	return withRemult(
		async () => {
			remult.user = {
				id: 'sys',
				name: 'sys',
				theme: 'light',
				roles: [Roles_Evlog.Evlog_Admin],
			}
			for (const r of rows.audits ?? []) {
				await remult.repo(EvlogAudit).insert(r as any)
			}
			for (const r of rows.traces ?? []) {
				await remult.repo(EvlogTrace).insert(r as any)
			}
			for (const r of rows.queries ?? []) {
				await remult.repo(EvlogTraceQuery).insert(r as any)
			}
			return EvlogStatsController.getStats(year, rowLimit)
		},
		{ dataProvider: dp },
	)
}

describe('EvlogStatsController.getStats(year)', () => {
	it('totals counts traces, audits, and unique actors across both', async () => {
		const stats = await seedAndAggregate({
			traces: [
				{ timestamp: new Date('2026-02-01'), source: 'server', actorId: 'u1' },
				{ timestamp: new Date('2026-03-01'), source: 'server', actorId: 'u2' },
			],
			audits: [
				{
					timestamp: new Date('2026-02-01'),
					action: 'x.create',
					actorId: 'u1',
					actorType: 'user',
					outcome: 'success',
				},
			],
		})
		expect(stats.totals.traces).toBe(2)
		expect(stats.totals.audits).toBe(1)
		expect(stats.totals.uniqueActors).toBe(2)
	})

	it('filters out rows outside the requested year', async () => {
		const stats = await seedAndAggregate({
			traces: [
				{ timestamp: new Date('2025-12-31T23:59:59Z'), source: 'server' },
				{ timestamp: new Date('2026-01-01'), source: 'server' },
				{ timestamp: new Date('2027-01-01'), source: 'server' },
			],
		})
		expect(stats.totals.traces).toBe(1)
	})

	it('monthlyAudits parses verb suffix from action', async () => {
		const stats = await seedAndAggregate({
			audits: [
				{
					timestamp: new Date('2026-04-01'),
					action: 'tasks.create',
					outcome: 'success',
					actorId: 'u',
					actorType: 'user',
				},
				{
					timestamp: new Date('2026-04-01'),
					action: 'tasks.update',
					outcome: 'success',
					actorId: 'u',
					actorType: 'user',
				},
				{
					timestamp: new Date('2026-04-01'),
					action: 'tasks.delete',
					outcome: 'success',
					actorId: 'u',
					actorType: 'user',
				},
			],
		})
		const apr = stats.monthlyAudits.find((m) => m.month === '2026-04')
		expect(apr).toBeDefined()
		expect(apr!.creates).toBe(1)
		expect(apr!.updates).toBe(1)
		expect(apr!.deletes).toBe(1)
		expect(apr!.total).toBe(3)
	})

	it('queries.hottest aggregates by SQL string with count', async () => {
		const stats = await seedAndAggregate({
			traces: [{ id: 'tr1', timestamp: new Date('2026-04-01'), path: '/api/tasks' }],
			queries: [
				{
					traceId: 'tr1',
					timestamp: new Date('2026-04-01'),
					path: '/api/tasks',
					sql: 'select * from tasks',
					duration: 1,
				},
				{
					traceId: 'tr1',
					timestamp: new Date('2026-04-01'),
					path: '/api/tasks',
					sql: 'select * from tasks',
					duration: 2,
				},
				{
					traceId: 'tr1',
					timestamp: new Date('2026-04-01'),
					path: '/api/tasks',
					sql: 'select 1',
					duration: 5,
				},
			],
		})
		const top = stats.queries.hottest[0]
		expect(top.fullSql).toBe('select * from tasks')
		expect(top.count).toBe(2)
	})

	it('returns truncated:false for small datasets', async () => {
		const stats = await seedAndAggregate({
			traces: [{ timestamp: new Date('2026-01-01'), source: 'server' }],
		})
		expect(stats.truncated).toBe(false)
	})

	it('returns truncated:true when row cap is hit', async () => {
		const traces = Array.from({ length: 3 }, (_, i) => ({
			timestamp: new Date('2026-01-01'),
			source: 'server' as const,
			path: `/p${i}`,
		}))
		const stats = await seedAndAggregate({ traces }, 2026, 3)
		expect(stats.truncated).toBe(true)
	})
})
