import { describe, expect, it, vi } from 'vitest'

import { createError } from 'evlog'

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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => throwLogged(err as any)).toThrow('denied')
		expect(errorSpy).toHaveBeenCalledOnce()
		expect(setSpy).toHaveBeenCalledWith({
			error: { why: 'rule', fix: 'do other thing', link: 'https://x.example/why', status: 403 },
		})

		vi.doUnmock('evlog/sveltekit')
		vi.resetModules()
	})
})
