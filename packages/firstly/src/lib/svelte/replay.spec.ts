import { describe, expect, it, vi } from 'vitest'

import { recordReads, replayReads, replayTag, type Reads } from './replay.js'

const json = (body: unknown) => new Response(JSON.stringify(body))

describe('replay', () => {
	it('escapes the tag, a row cannot close the script', () => {
		const tag = replayTag({ a: [{ status: 200, body: '</script><script>alert(1)</script>' }] })
		expect(tag.match(/<script/g)).toHaveLength(1)
		expect(tag.match(/<\/script>/g)).toHaveLength(1)
		const payload = tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</script>'))
		expect(JSON.parse(payload).a[0].body).toBe('</script><script>alert(1)</script>')
	})

	it('adds no tag when nothing was read', () => {
		expect(replayTag({})).toBe('')
	})

	it('records reads, not writes', async () => {
		const reads: Reads = {}
		const f = recordReads(async () => json([1]), reads)
		await f('/api/tasks')
		await f('/api/tasks', { method: 'POST', body: '{}' })
		await f('/api/tasks?__action=get', { method: 'POST', body: '{"a":1}' })
		expect(Object.keys(reads)).toEqual(['/api/tasks|', '/api/tasks?__action=get|{"a":1}'])
	})

	it('answers each saved read once', async () => {
		const base = vi.fn(async () => json(['network']))
		const f = replayReads(base, () => ({
			'/api/tasks|': [
				{ status: 200, body: '["a"]' },
				{ status: 200, body: '["b"]' },
			],
		}))
		expect(await (await f('/api/tasks')).json()).toEqual(['a'])
		expect(await (await f('/api/tasks')).json()).toEqual(['b'])
		expect(base).not.toHaveBeenCalled()
		expect(await (await f('/api/tasks')).json()).toEqual(['network'])
	})

	it('keeps long filters apart by body', async () => {
		const base = vi.fn(async () => json(['network']))
		const f = replayReads(base, () => ({
			'/api/tasks?__action=get|{"a":1}': [{ status: 200, body: '["a"]' }],
		}))
		const url = '/api/tasks?__action=get'
		await f(url, { method: 'POST', body: '{"a":2}' })
		expect(base).toHaveBeenCalledTimes(1)
		expect(await (await f(url, { method: 'POST', body: '{"a":1}' })).json()).toEqual(['a'])
	})

	it('never answers a write, and a write drops the saved reads', async () => {
		const base = vi.fn(async () => json(['network']))
		const f = replayReads(base, () => ({
			'/api/tasks|': [{ status: 200, body: '["ssr"]' }],
		}))
		await f('/api/tasks', { method: 'POST', body: '{}' })
		expect(await (await f('/api/tasks')).json()).toEqual(['network'])
		expect(base).toHaveBeenCalledTimes(2)
	})

	it('stops replaying after the hydration window', async () => {
		vi.useFakeTimers()
		const base = vi.fn(async () => json(['network']))
		const f = replayReads(base, () => ({
			'/api/tasks|': [{ status: 200, body: '["ssr"]' }],
		}))
		vi.advanceTimersByTime(6000)
		expect(await (await f('/api/tasks')).json()).toEqual(['network'])
		vi.useRealTimers()
	})
})
