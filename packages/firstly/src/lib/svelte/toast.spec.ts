import { toast as sonner } from 'svelte-sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from './toast'

// Mock svelte-sonner so we assert forwarding without rendering a Toaster.
vi.mock('svelte-sonner', () => ({
	toast: {
		success: vi.fn(() => 'id-success'),
		error: vi.fn(() => 'id-error'),
		info: vi.fn(() => 'id-info'),
		warning: vi.fn(() => 'id-warning'),
		dismiss: vi.fn(),
	},
}))

beforeEach(() => vi.clearAllMocks())

describe('toast wrapper', () => {
	it('forwards success with the resolved message and no opts', () => {
		const id = toast.success('Saved')
		expect(sonner.success).toHaveBeenCalledWith('Saved', undefined)
		expect(id).toBe('id-success')
	})

	it('resolves a LocalizedMessage function at call time', () => {
		const msg = vi.fn(() => 'Localized')
		toast.error(msg)
		expect(msg).toHaveBeenCalledOnce()
		expect(sonner.error).toHaveBeenCalledWith('Localized', undefined)
	})

	it('resolves description + action labels into the sonner shape', () => {
		const onClick = () => {}
		toast.info('Hi', {
			description: () => 'more',
			duration: 1000,
			action: { label: 'Undo', onClick },
		})
		expect(sonner.info).toHaveBeenCalledWith('Hi', {
			description: 'more',
			duration: 1000,
			action: { label: 'Undo', onClick },
		})
	})

	it('show() dispatches on kind (default info)', () => {
		toast.show('a', { kind: 'warning' })
		expect(sonner.warning).toHaveBeenCalledWith('a', undefined)
		toast.show('b')
		expect(sonner.info).toHaveBeenCalledWith('b', undefined)
	})

	it('fromError extracts a message from Error / string / { message } / unknown', () => {
		toast.fromError(new Error('boom'))
		expect(sonner.error).toHaveBeenLastCalledWith('boom', undefined)
		toast.fromError('str')
		expect(sonner.error).toHaveBeenLastCalledWith('str', undefined)
		toast.fromError({ message: 'om' })
		expect(sonner.error).toHaveBeenLastCalledWith('om', undefined)
		toast.fromError(42)
		expect(sonner.error).toHaveBeenLastCalledWith('42', undefined)
	})

	it('dismiss forwards the id', () => {
		toast.dismiss('id-1')
		expect(sonner.dismiss).toHaveBeenCalledWith('id-1')
	})
})
