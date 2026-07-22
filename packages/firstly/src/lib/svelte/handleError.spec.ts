import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { stackHandleClientError, withStaleDeployReload } from './handleError'

const CHUNK_MSG = 'Failed to fetch dynamically imported module: /_app/immutable/x.js'

function input(over: { message?: string; href?: string } = {}) {
	return {
		error: new Error(over.message ?? 'boom'),
		message: over.message ?? 'boom',
		status: 500,
		event: { url: new URL(over.href ?? 'https://app.test/page') },
	} as unknown as Parameters<ReturnType<typeof stackHandleClientError>>[0]
}

let store: Record<string, string>
let assign: ReturnType<typeof vi.fn>

beforeEach(() => {
	store = {}
	assign = vi.fn()
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => void (store[k] = v),
		removeItem: (k: string) => void delete store[k],
	})
	vi.stubGlobal('location', { assign })
})

afterEach(() => vi.unstubAllGlobals())

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
})
