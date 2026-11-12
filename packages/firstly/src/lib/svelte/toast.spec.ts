import { toast as ui } from '@ui-sdk/svelte/toast'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from './toast'

// Mock ui-sdk's toaster so we assert forwarding without rendering a region.
vi.mock('@ui-sdk/svelte/toast', () => ({
	toast: {
		success: vi.fn(() => 'id-success'),
		error: vi.fn(() => 'id-error'),
		info: vi.fn(() => 'id-info'),
		warning: vi.fn(() => 'id-warning'),
		dismiss: vi.fn(),
	},
}))

const shown = (title: string, html: string) => expect.objectContaining({ title, data: { html } })

beforeEach(() => vi.clearAllMocks())

describe('toast wrapper', () => {
	it('uses the per-kind default title and passes the description as html', () => {
		const id = toast.success('Saved')
		expect(ui.success).toHaveBeenCalledWith(shown('Success', 'Saved'))
		expect(id).toBe('id-success')
	})

	it('overrides the title via opts.title', () => {
		toast.error('Could not save', { title: 'Oops' })
		expect(ui.error).toHaveBeenCalledWith(shown('Oops', 'Could not save'))
	})

	it('resolves LocalizedMessage functions (description + title) at call time', () => {
		const desc = vi.fn(() => 'Localized')
		const title = vi.fn(() => 'Titre')
		toast.error(desc, { title })
		expect(desc).toHaveBeenCalledOnce()
		expect(title).toHaveBeenCalledOnce()
		expect(ui.error).toHaveBeenCalledWith(shown('Titre', 'Localized'))
	})

	it('forwards duration + action', () => {
		const onClick = () => {}
		toast.info('Hi', { duration: 1000, action: { label: 'Undo', onClick } })
		expect(ui.info).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'Info',
				data: { html: 'Hi' },
				duration: 1000,
				action: { label: 'Undo', onAction: onClick },
			}),
		)
	})

	it('show() dispatches on kind (default info)', () => {
		toast.show('a', { kind: 'warning' })
		expect(ui.warning).toHaveBeenCalledWith(shown('Warning', 'a'))
		toast.show('b')
		expect(ui.info).toHaveBeenCalledWith(shown('Info', 'b'))
	})

	it('fromError extracts a message from Error / string / { message } / unknown', () => {
		toast.fromError(new Error('boom'))
		expect(ui.error).toHaveBeenLastCalledWith(shown('Error', 'boom'))
		toast.fromError('str')
		expect(ui.error).toHaveBeenLastCalledWith(shown('Error', 'str'))
		toast.fromError({ message: 'om' })
		expect(ui.error).toHaveBeenLastCalledWith(shown('Error', 'om'))
		toast.fromError(42)
		expect(ui.error).toHaveBeenLastCalledWith(shown('Error', '42'))
	})

	it('fromError escapes HTML so a malicious error message cannot inject markup', () => {
		// Error messages often carry server- or user-controlled text; the description is rendered
		// as HTML, so fromError must entity-encode it (unlike the HTML-capable toast.error).
		toast.fromError(new Error('<img src=x onerror="alert(1)"> & done'))
		expect(ui.error).toHaveBeenLastCalledWith(
			shown('Error', '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; done'),
		)
	})

	it('dismiss forwards the id', () => {
		toast.dismiss('id-1')
		expect(ui.dismiss).toHaveBeenCalledWith('id-1')
	})
})
