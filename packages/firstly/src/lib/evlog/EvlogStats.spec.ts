import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import EvlogStats from './EvlogStats.svelte'
import { EvlogStatsController } from './EvlogStatsController.js'

vi.mock('./EvlogStatsController.js', () => ({
	EvlogStatsController: {
		getStats: vi.fn(async () => ({
			year: 2026,
			truncated: false,
			totals: { traces: 0, audits: 0, uniqueActors: 0 },
			monthlyTraces: [],
			monthlyAudits: [],
			monthlyByModule: [],
			topPages: [],
			pageFlows: [],
			browsers: [],
			os: [],
			devices: [],
			queries: { slowest: [], mostTime: [], hottest: [] },
		})),
	},
}))

describe('<EvlogStats>', () => {
	it('calls getStats on mount', async () => {
		render(EvlogStats)
		// Allow onMount + microtasks to run
		await new Promise((r) => setTimeout(r, 0))
		expect(EvlogStatsController.getStats).toHaveBeenCalled()
	})

	it('refresh button triggers another getStats call', async () => {
		const { container } = render(EvlogStats)
		await new Promise((r) => setTimeout(r, 0))
		;(EvlogStatsController.getStats as ReturnType<typeof vi.fn>).mockClear()
		// Header has a single button (refresh) - find by tag
		const btn = container.querySelector('button')
		expect(btn).not.toBeNull()
		await fireEvent.click(btn!)
		expect(EvlogStatsController.getStats).toHaveBeenCalled()
	})

	it('shows a partial-view warning when stats are truncated', async () => {
		;(EvlogStatsController.getStats as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			year: 2026,
			truncated: true,
			totals: { traces: 0, audits: 0, uniqueActors: 0 },
			monthlyTraces: [],
			monthlyAudits: [],
			monthlyByModule: [],
			topPages: [],
			pageFlows: [],
			browsers: [],
			os: [],
			devices: [],
			queries: { slowest: [], mostTime: [], hottest: [] },
		})
		const { container } = render(EvlogStats)
		await new Promise((r) => setTimeout(r, 0))
		const alerts = [...container.querySelectorAll('[role="alert"]')]
		expect(alerts.some((el) => /partial view/i.test(el.textContent ?? ''))).toBe(true)
	})
})
