import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ffHandleError } from './handleError'

const CHUNK_MSG = 'Failed to fetch dynamically imported module: /_app/immutable/x.js'

function input(over: { message?: string; href?: string } = {}) {
	return {
		error: new Error(over.message ?? 'boom'),
		message: over.message ?? 'boom',
		status: 500,
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
		const handle = ffHandleError(() => ({ message: 'broken' }))
		handle(input({ message: CHUNK_MSG }))
		const res = handle(input({ message: CHUNK_MSG }))
		expect(assign).toHaveBeenCalledTimes(1)
		expect(res).toEqual({ message: 'broken' })
	})

	it('retries again after the guard window elapses', () => {
		vi.useFakeTimers()
		const handle = ffHandleError()
		handle(input({ message: CHUNK_MSG }))
		vi.advanceTimersByTime(11_000)
		handle(input({ message: CHUNK_MSG }))
		expect(assign).toHaveBeenCalledTimes(2)
		vi.useRealTimers()
	})

	it('ignores non-chunk errors and delegates to onError', () => {
		const onError = vi.fn(() => ({ message: 'logged' }))
		const res = ffHandleError(onError)(input({ message: 'random' }))
		expect(assign).not.toHaveBeenCalled()
		expect(onError).toHaveBeenCalledOnce()
		expect(res).toEqual({ message: 'logged' })
	})

	it('falls back to a default message with no handler', () => {
		expect(ffHandleError()(input({ message: 'random' }))).toEqual({ message: 'Something went wrong' })
	})
})
