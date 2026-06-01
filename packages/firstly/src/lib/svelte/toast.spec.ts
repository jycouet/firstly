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

// The description is rendered through this component; mock it so the test runs in node.
vi.mock('./FF_ToastHtml.svelte', () => ({ default: 'FF_ToastHtml' }))

beforeEach(() => vi.clearAllMocks())

describe('toast wrapper', () => {
	it('uses the per-kind default title and passes the description as html', () => {
		const id = toast.success('Saved')
		expect(sonner.success).toHaveBeenCalledWith(
			'Success',
			expect.objectContaining({ componentProps: { html: 'Saved' } }),
		)
		expect(id).toBe('id-success')
	})

	it('overrides the title via opts.title', () => {
		toast.error('Could not save', { title: 'Oops' })
		expect(sonner.error).toHaveBeenCalledWith(
			'Oops',
			expect.objectContaining({ componentProps: { html: 'Could not save' } }),
		)
	})

	it('resolves LocalizedMessage functions (description + title) at call time', () => {
		const desc = vi.fn(() => 'Localized')
		const title = vi.fn(() => 'Titre')
		toast.error(desc, { title })
		expect(desc).toHaveBeenCalledOnce()
		expect(title).toHaveBeenCalledOnce()
		expect(sonner.error).toHaveBeenCalledWith(
			'Titre',
			expect.objectContaining({ componentProps: { html: 'Localized' } }),
		)
	})

	it('forwards duration + action', () => {
		const onClick = () => {}
		toast.info('Hi', { duration: 1000, action: { label: 'Undo', onClick } })
		expect(sonner.info).toHaveBeenCalledWith(
			'Info',
			expect.objectContaining({
				componentProps: { html: 'Hi' },
				duration: 1000,
				action: { label: 'Undo', onClick },
			}),
		)
	})

	it('show() dispatches on kind (default info)', () => {
		toast.show('a', { kind: 'warning' })
		expect(sonner.warning).toHaveBeenCalledWith(
			'Warning',
			expect.objectContaining({ componentProps: { html: 'a' } }),
		)
		toast.show('b')
		expect(sonner.info).toHaveBeenCalledWith(
			'Info',
			expect.objectContaining({ componentProps: { html: 'b' } }),
		)
	})

	it('fromError extracts a message from Error / string / { message } / unknown', () => {
		toast.fromError(new Error('boom'))
		expect(sonner.error).toHaveBeenLastCalledWith(
			'Error',
			expect.objectContaining({ componentProps: { html: 'boom' } }),
		)
		toast.fromError('str')
		expect(sonner.error).toHaveBeenLastCalledWith(
			'Error',
			expect.objectContaining({ componentProps: { html: 'str' } }),
		)
		toast.fromError({ message: 'om' })
		expect(sonner.error).toHaveBeenLastCalledWith(
			'Error',
			expect.objectContaining({ componentProps: { html: 'om' } }),
		)
		toast.fromError(42)
		expect(sonner.error).toHaveBeenLastCalledWith(
			'Error',
			expect.objectContaining({ componentProps: { html: '42' } }),
		)
	})

	it('dismiss forwards the id', () => {
		toast.dismiss('id-1')
		expect(sonner.dismiss).toHaveBeenCalledWith('id-1')
	})
})
