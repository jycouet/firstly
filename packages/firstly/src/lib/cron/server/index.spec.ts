import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InMemoryDataProvider, remult, repo, type Remult } from 'remult'

import { log } from '..'
import { Cron } from '../Cron'
import { cron, jobs, type CronJobParams } from './index'

const register = async (params: CronJobParams) => {
	const m = cron([params])
	await m.initApi?.(remult as Remult)
	return jobs[params.topic].job!
}

describe('cron', () => {
	let successSpy: ReturnType<typeof vi.spyOn>
	let infoSpy: ReturnType<typeof vi.spyOn>
	let errorSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		remult.dataProvider = new InMemoryDataProvider()
		vi.restoreAllMocks()
		successSpy = vi.spyOn(log, 'success').mockImplementation(() => [])
		infoSpy = vi.spyOn(log, 'info').mockImplementation(() => [])
		errorSpy = vi.spyOn(log, 'error').mockImplementation(() => [])
	})

	it('stores the run and stays silent for a fast tick by default', async () => {
		const job = await register({
			topic: 'c_default',
			cronTime: '0 3 * * *',
			onTick: () => ({ ok: 1 }),
		})
		expect(successSpy).toHaveBeenCalledOnce()
		expect(successSpy.mock.calls[0][0]).toContain('setup done')

		await job.fireOnTick()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_default', status: 'ended' })).toBe(1)
		})

		const row = (await repo(Cron).findFirst({ topic: 'c_default' }))!
		expect(row.result).toEqual({ ok: 1 })
		expect(row.endedAt).not.toBeNull()

		// under the 100ms default, no done line (and no starting/result lines)
		expect(successSpy).toHaveBeenCalledOnce()
		expect(infoSpy).not.toHaveBeenCalled()
	})

	it('logs the done line when the tick is slower than the threshold', async () => {
		const job = await register({
			topic: 'c_slow',
			cronTime: '0 3 * * *',
			logs: { ended: 50 },
			onTick: async () => {
				await new Promise((r) => setTimeout(r, 60))
				return { ok: 1 }
			},
		})
		await job.fireOnTick()
		await vi.waitFor(() => expect(successSpy).toHaveBeenCalledTimes(2))
		expect(successSpy.mock.calls[1][0]).toContain('done in')
	})

	it('logs starting and result when opted in (ended: true = always)', async () => {
		const job = await register({
			topic: 'c_verbose',
			cronTime: '0 3 * * *',
			logs: { starting: true, result: true, ended: true },
			onTick: () => ({ ok: 1 }),
		})
		await job.fireOnTick()
		await vi.waitFor(() => expect(successSpy).toHaveBeenCalledTimes(2))

		expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('starting...'))
		const doneCall = successSpy.mock.calls[1]
		expect(doneCall[0]).toContain('done in')
		expect(doneCall[1]).toEqual({ ok: 1 })
	})

	it('is fully silent with setup & ended off', async () => {
		const job = await register({
			topic: 'c_silent',
			cronTime: '0 3 * * *',
			logs: { setup: false, ended: false },
			onTick: () => ({ ok: 1 }),
		})
		await job.fireOnTick()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_silent', status: 'ended' })).toBe(1)
		})
		expect(successSpy).not.toHaveBeenCalled()
		expect(infoSpy).not.toHaveBeenCalled()
	})

	it('marks failed runs, logs the error, and frees the concurrency slot', async () => {
		let boom = true
		const job = await register({
			topic: 'c_fail',
			cronTime: '0 3 * * *',
			onTick: () => {
				if (boom) throw new Error('boom')
				return { ok: 1 }
			},
		})

		await job.fireOnTick()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_fail', status: 'failed' })).toBe(1)
		})
		const failed = (await repo(Cron).findFirst({ topic: 'c_fail', status: 'failed' }))!
		expect(failed.result).toEqual({ error: 'boom' })
		expect(failed.endedAt).not.toBeNull()
		expect(errorSpy).toHaveBeenCalledOnce()
		expect(errorSpy.mock.calls[0][0]).toContain('failed after')

		// the slot was freed, next tick runs instead of being skipped
		boom = false
		await job.fireOnTick()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_fail', status: 'ended' })).toBe(1)
		})
	})

	it('skips (and always logs) when the concurrent limit is reached', async () => {
		let release!: () => void
		const gate = new Promise<void>((r) => (release = r))
		const job = await register({
			topic: 'c_skip',
			cronTime: '0 3 * * *',
			onTick: async () => {
				await gate
				return { ok: 1 }
			},
		})

		await job.fireOnTick()
		await job.fireOnTick()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_skip', status: 'skipped' })).toBe(1)
		})
		expect(infoSpy).toHaveBeenCalledWith(
			expect.stringContaining('skipped because of concurrent limit'),
		)

		release()
		await vi.waitFor(async () => {
			expect(await repo(Cron).count({ topic: 'c_skip', status: 'ended' })).toBe(1)
		})
	})
})
