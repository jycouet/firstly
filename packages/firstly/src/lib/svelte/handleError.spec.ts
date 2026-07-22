import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ffHandleError } from './handleError'

const CHUNK_MSG = 'Failed to fetch dynamically imported module: /_app/immutable/x.js'

function input(over: { message?: string; status?: number; href?: string } = {}) {
	return {
		error: new Error(over.message ?? 'boom'),
		message: over.message ?? 'boom',
		status: over.status ?? 500,
		event: { url: new URL(over.href ?? 'https://app.test/page') },
	} as unknown as Parameters<ReturnType<typeof ffHandleError>>[0]
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

describe('ffHandleError', () => {
	it('hard-reloads once on a chunk-load failure', () => {
		const res = ffHandleError()(input({ message: CHUNK_MSG }))
		expect(assign).toHaveBeenCalledWith('https://app.test/page')
		expect(res).toBeUndefined()
	})

	it('does not reload twice for the same url (loop guard)', () => {
		const handle = ffHandleError({ onError: () => ({ message: 'broken' }) })
		handle(input({ message: CHUNK_MSG }))
		const res = handle(input({ message: CHUNK_MSG }))
		expect(assign).toHaveBeenCalledTimes(1)
		expect(res).toEqual({ message: 'broken' })
	})

	it('retries again after the guard window elapses', () => {
		vi.useFakeTimers()
		const handle = ffHandleError({ retryWindowMs: 1000 })
		handle(input({ message: CHUNK_MSG }))
		vi.advanceTimersByTime(1500)
		handle(input({ message: CHUNK_MSG }))
		expect(assign).toHaveBeenCalledTimes(2)
		vi.useRealTimers()
	})

	it('ignores non-chunk errors and delegates to onError', () => {
		const onError = vi.fn(() => ({ message: 'logged' }))
		const res = ffHandleError({ onError })(input({ message: 'random' }))
		expect(assign).not.toHaveBeenCalled()
		expect(onError).toHaveBeenCalledOnce()
		expect(res).toEqual({ message: 'logged' })
	})

	it('leaves 404s alone unless recoverOn404 is set', () => {
		ffHandleError()(input({ status: 404, message: 'Not found' }))
		expect(assign).not.toHaveBeenCalled()
		ffHandleError({ recoverOn404: true })(input({ status: 404, message: 'Not found' }))
		expect(assign).toHaveBeenCalledOnce()
	})

	it('falls back to a default message with no onError', () => {
		expect(ffHandleError()(input({ message: 'random' }))).toEqual({ message: 'Something went wrong' })
	})
})
