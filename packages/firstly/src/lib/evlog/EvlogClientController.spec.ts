import { describe, expect, it, vi } from 'vitest'

import { InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogClientController, type ClientNavInput } from './EvlogClientController.js'

// Capture what recordNavigations emits (it dynamically imports createLogger).
const emitted: any[] = []
vi.mock('evlog', async (orig) => {
	const mod = await orig<typeof import('evlog')>()
	return {
		...mod,
		createLogger: (init: any) => ({ emit: () => emitted.push(init) }),
	}
})

async function run(inputs: ClientNavInput[]): Promise<void> {
	const dp: DataProvider = new InMemoryDataProvider()
	await withRemult(() => EvlogClientController.recordNavigations(inputs), { dataProvider: dp })
}

describe('EvlogClientController.recordNavigations', () => {
	it('caps the batch to 50 even if the client sends more', async () => {
		emitted.length = 0
		const inputs = Array.from({ length: 60 }, (_, i) => ({ pathname: `/p/${i}` }))
		await run(inputs)
		expect(emitted).toHaveLength(50)
	})

	it('drops events with out-of-window timestamps', async () => {
		emitted.length = 0
		const now = Date.now()
		await run([
			{ pathname: '/ok' },
			{ pathname: '/old', at: now - 20 * 60 * 1000 },
			{ pathname: '/future', at: now + 20 * 60 * 1000 },
		])
		expect(emitted.map((e) => e.path)).toEqual(['/ok'])
	})

	it('skips empty pathname and truncates an oversized one', async () => {
		emitted.length = 0
		await run([{ pathname: '' }, { pathname: 'x'.repeat(5000) }])
		expect(emitted).toHaveLength(1)
		expect(emitted[0].path.length).toBe(2048)
	})

	it('caps routeId and referrer length', async () => {
		emitted.length = 0
		await run([
			{ pathname: '/p', routeId: 'r'.repeat(5000), referrer: 'f'.repeat(5000) },
		])
		expect(emitted).toHaveLength(1)
		expect(emitted[0].routeId.length).toBeLessThanOrEqual(512)
		expect(emitted[0].referrer.length).toBeLessThanOrEqual(2048)
	})

	it('redacts secret-looking searchParams values but keeps the keys', async () => {
		emitted.length = 0
		await run([
			{
				pathname: '/auth/callback',
				searchParams: [
					['code', 'super-secret-oauth-code'],
					['token', 'abc.def.ghi'],
					['tab', 'overview'],
				],
			},
		])
		expect(emitted).toHaveLength(1)
		const sp = Object.fromEntries(emitted[0].searchParams)
		expect(sp.code).toBe('[REDACTED]')
		expect(sp.token).toBe('[REDACTED]')
		expect(sp.tab).toBe('overview')
	})

	it('coerces a non-array searchParams to an empty array', async () => {
		emitted.length = 0
		await run([{ pathname: '/p', searchParams: 'not-an-array' as never }])
		expect(emitted).toHaveLength(1)
		expect(emitted[0].searchParams).toEqual([])
	})

	it('caps searchParams entry count and per-value length', async () => {
		emitted.length = 0
		const many: Array<[string, string]> = Array.from({ length: 100 }, (_, i) => [
			`k${i}`,
			'v'.repeat(1000),
		])
		await run([{ pathname: '/p', searchParams: many }])
		expect(emitted).toHaveLength(1)
		expect(emitted[0].searchParams.length).toBeLessThanOrEqual(50)
		for (const [, v] of emitted[0].searchParams) expect(v.length).toBeLessThanOrEqual(256)
	})
})
