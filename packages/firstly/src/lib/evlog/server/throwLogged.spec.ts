import { createError } from 'evlog'
import { describe, expect, it, vi } from 'vitest'

describe('throwLogged', () => {
	it('sets error fields on the active wide event then throws the error', async () => {
		const setSpy = vi.fn()
		const errorSpy = vi.fn()
		vi.resetModules()
		vi.doMock('evlog/sveltekit', () => ({
			useLogger: () => ({ error: errorSpy, set: setSpy }),
		}))
		const { throwLogged } = await import('./throwLogged.js')

		const err = createError({
			status: 403,
			message: 'denied',
			why: 'rule',
			fix: 'do other thing',
			link: 'https://x.example/why',
		})

		expect(() => throwLogged(err as any)).toThrow('denied')
		expect(errorSpy).toHaveBeenCalledOnce()
		expect(setSpy).toHaveBeenCalledWith({
			error: { why: 'rule', fix: 'do other thing', link: 'https://x.example/why', status: 403 },
		})

		vi.doUnmock('evlog/sveltekit')
		vi.resetModules()
	})

	it('still throws the original error when useLogger() is unavailable (outside a request scope)', async () => {
		vi.resetModules()
		vi.doMock('evlog/sveltekit', () => ({
			useLogger: () => {
				throw new Error('[evlog] useLogger() was called outside of an evlog handle context')
			},
		}))
		const { throwLogged } = await import('./throwLogged.js')

		const err = createError({
			status: 403,
			message: 'denied',
			why: 'rule',
			fix: 'do other thing',
			link: 'https://x.example/why',
		})

		// The original error must surface, not evlog's "outside handle context" error.
		expect(() => throwLogged(err as any)).toThrow('denied')

		vi.doUnmock('evlog/sveltekit')
		vi.resetModules()
	})
})
