import { InMemoryDataProvider, remult } from 'remult'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FeedbackController } from './FeedbackController'

const ok = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 })
const rateLimited = () =>
	new Response(JSON.stringify({ message: 'You have exceeded a secondary rate limit' }), {
		status: 403,
	})

describe('feedback createIssue', () => {
	beforeEach(() => {
		// Not a proxy: backend methods run in-process instead of over HTTP.
		remult.dataProvider = new InMemoryDataProvider()
		remult.context.feedbackOptions = {
			GITHUB_API_TOKEN: 'token',
			repo: { owner: 'o', name: 'r' },
		}
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})
	afterEach(() => vi.restoreAllMocks())

	it('returns the created issue when the metadata comment fails', async () => {
		const fetch = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(ok({ repository: { id: 'R1', labels: { nodes: [] } } }))
			.mockResolvedValueOnce(ok({ createIssue: { issue: { id: 'I1', number: 151 } } }))
			.mockResolvedValueOnce(rateLimited())

		const issue = await FeedbackController.createIssue('M1', 'title', 'body', { page: '/x' })

		expect(issue).toEqual({ id: 'I1', number: 151 })
		expect(fetch).toHaveBeenCalledTimes(3)
	})

	it('throws a clear error when GitHub answers without data', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(rateLimited())

		await expect(FeedbackController.createIssue('M1', 't', 'b', {})).rejects.toThrow(
			'GitHub request failed (403)',
		)
	})
})
