import { afterEach, describe, expect, it, vi } from 'vitest'

// goto resolves only when the test says so, the URL changes then
const nav = vi.hoisted(() => {
	const pending: Array<() => void> = []
	const goto = vi.fn(
		(url: string) =>
			new Promise<void>((resolve) => {
				pending.push(() => {
					history.replaceState(null, '', url)
					resolve()
				})
			}),
	)
	return { pending, goto }
})

vi.mock('$app/navigation', () => ({ goto: nav.goto }))
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return new URL(window.location.href)
		},
	},
}))

import { SP } from './SP.svelte'

const DEBOUNCE = 5
// the browser runner keeps its own params in the URL
const RUNNER_URL = window.location.href
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const debounced = () => new SP({ q: '' }, { config: { q: { debounce: DEBOUNCE } } })

describe('SP.computing', () => {
	afterEach(() => {
		nav.pending.splice(0)
		nav.goto.mockClear()
		history.replaceState(null, '', RUNNER_URL)
	})

	it('stays on until the navigation lands', async () => {
		const sp = debounced()
		sp.obj.q = 'abc'
		expect(sp.computing).toBe(true)

		await wait(DEBOUNCE * 4)
		expect(nav.goto).toHaveBeenCalledOnce()
		expect(sp.computing).toBe(true)

		nav.pending.shift()!()
		await wait(0)
		expect(sp.computing).toBe(false)
		expect(new URLSearchParams(window.location.search).get('q')).toBe('abc')
	})

	it('an older navigation landing keeps it on for the newer one', async () => {
		const sp = debounced()
		sp.obj.q = 'a'
		await wait(DEBOUNCE * 4)
		sp.obj.q = 'ab'
		await wait(DEBOUNCE * 4)
		expect(nav.goto).toHaveBeenCalledTimes(2)

		nav.pending.shift()!()
		await wait(0)
		expect(sp.computing).toBe(true)

		nav.pending.shift()!()
		await wait(0)
		expect(sp.computing).toBe(false)
	})

	it('turns off without navigating when the URL would not change', async () => {
		const sp = debounced()
		sp.obj.q = 'x'
		sp.obj.q = ''
		await wait(DEBOUNCE * 4)
		expect(nav.goto).not.toHaveBeenCalled()
		expect(sp.computing).toBe(false)
	})
})
