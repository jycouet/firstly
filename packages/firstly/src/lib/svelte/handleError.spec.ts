import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reloadOnStaleChunk, stackHandleClientError, withStaleDeployReload } from './handleError'

const nav = vi.hoisted(() => ({
	navigating: { to: null as { url: URL } | null },
	updated: { check: vi.fn<() => Promise<boolean>>() },
}))
vi.mock('$app/state', () => nav)

const CHUNK_MSG = 'Failed to fetch dynamically imported module: /_app/immutable/x.js'
const OTHER = 'https://app.test/other'

function input(over: { message?: string; href?: string } = {}) {
	return {
		kind: 'unknown',
		error: new TypeError(over.message ?? 'boom'),
		event: { url: new URL(over.href ?? 'https://app.test/page') },
	} as unknown as Parameters<ReturnType<typeof stackHandleClientError>>[0]
}

let store: Record<string, string>
let assign: ReturnType<typeof vi.fn>
let reload: ReturnType<typeof vi.fn>

beforeEach(() => {
	store = {}
	assign = vi.fn()
	reload = vi.fn()
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => void (store[k] = v),
		removeItem: (k: string) => void delete store[k],
	})
	vi.stubGlobal('location', { assign, reload, href: 'https://app.test/page' })
	nav.navigating.to = null
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.clearAllMocks()
})

describe('stackHandleClientError', () => {
	it('runs middlewares outermost-first and returns the base message', () => {
		const calls: string[] = []
		const trace =
			(name: string): Parameters<typeof stackHandleClientError>[0] =>
			(next) =>
			(i) => {
				calls.push(name)
				return next(i)
			}
		const res = stackHandleClientError(trace('a'), trace('b'))(input())
		expect(calls).toEqual(['a', 'b'])
		expect(res).toEqual({ message: 'Something went wrong' })
	})

	it('lets a middleware short-circuit without calling next', () => {
		const later = vi.fn()
		const res = stackHandleClientError(
			() => () => ({ message: 'stop' }),
			(next) => (i) => {
				later()
				return next(i)
			},
		)(input())
		expect(res).toEqual({ message: 'stop' })
		expect(later).not.toHaveBeenCalled()
	})
})

describe('withStaleDeployReload', () => {
	const handle = (over?: Parameters<typeof input>[0]) =>
		stackHandleClientError(withStaleDeployReload(), () => () => ({ message: 'logged' }))(input(over))

	it('hard-reloads once on a chunk-load failure', () => {
		const res = handle({ message: CHUNK_MSG })
		expect(assign).toHaveBeenCalledWith('https://app.test/page')
		expect(res).toBeUndefined()
	})

	it('reloads on the target of a navigation', () => {
		nav.navigating.to = { url: new URL(OTHER) }
		handle({ message: CHUNK_MSG, href: OTHER })
		expect(assign).toHaveBeenCalledWith(OTHER)
	})

	it('leaves a failed preload alone', () => {
		const res = handle({ message: CHUNK_MSG, href: OTHER })
		expect(assign).not.toHaveBeenCalled()
		expect(res).toEqual({ message: 'logged' })
	})

	it('does not reload twice for the same url (loop guard)', () => {
		handle({ message: CHUNK_MSG })
		const res = handle({ message: CHUNK_MSG })
		expect(assign).toHaveBeenCalledTimes(1)
		expect(res).toEqual({ message: 'logged' })
	})

	it('retries again after the guard window elapses', () => {
		vi.useFakeTimers()
		handle({ message: CHUNK_MSG })
		vi.advanceTimersByTime(11_000)
		handle({ message: CHUNK_MSG })
		expect(assign).toHaveBeenCalledTimes(2)
		vi.useRealTimers()
	})

	it('passes non-chunk errors through to next', () => {
		const res = handle({ message: 'random' })
		expect(assign).not.toHaveBeenCalled()
		expect(res).toEqual({ message: 'logged' })
	})

	it('ignores app and framework errors, whatever their message', () => {
		const middleware = withStaleDeployReload()(() => ({ message: 'logged' }))
		const res = middleware({ ...input(), kind: 'framework', error: { message: CHUNK_MSG } } as any)
		expect(assign).not.toHaveBeenCalled()
		expect(res).toEqual({ message: 'logged' })
	})
})

describe('reloadOnStaleChunk', () => {
	const COMPONENT = `${CHUNK_MSG.replace('x.js', 'chunks/map.js')}`
	const ROUTE = `${CHUNK_MSG.replace('x.js', 'nodes/9.js')}`

	async function fail(message: string, stale: boolean) {
		nav.updated.check.mockResolvedValue(stale)
		let listener: (event: Event & { payload: unknown }) => void = () => {}
		vi.stubGlobal('addEventListener', (type: string, fn: typeof listener) => {
			if (type === 'vite:preloadError') listener = fn
		})
		reloadOnStaleChunk()
		listener(Object.assign(new Event('vite:preloadError'), { payload: new TypeError(message) }))
		await vi.waitFor(() => Promise.resolve())
	}

	it('reloads when a lazy component chunk fails on a new version', async () => {
		await fail(COMPONENT, true)
		expect(reload).toHaveBeenCalledOnce()
	})

	it('stays put without a new version', async () => {
		await fail(COMPONENT, false)
		expect(nav.updated.check).toHaveBeenCalled()
		expect(reload).not.toHaveBeenCalled()
	})

	it('leaves route chunks to Kit', async () => {
		await fail(ROUTE, true)
		expect(reload).not.toHaveBeenCalled()
	})
})
