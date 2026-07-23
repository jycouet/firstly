import { describe, expect, it } from 'vitest'

import { handleCaching } from './handleCaching'

async function run(pathname: string, status = 200) {
	const response = new Response('x', { status })
	const event = { url: new URL(`https://app.test${pathname}`) }
	// @ts-expect-error minimal event
	const res = await handleCaching({ event, resolve: async () => response })
	return res.headers.get('Cache-Control')
}

describe('handleCaching', () => {
	it('caches hashed assets forever', async () => {
		expect(await run('/_app/immutable/chunks/abc123.js')).toBe(
			'public, max-age=31536000, immutable',
		)
	})

	it('never caches a 404 chunk (stale-deploy brick)', async () => {
		expect(await run('/_app/immutable/chunks/gone.js', 404)).toBe(
			'no-cache, no-store, must-revalidate',
		)
	})

	it('keeps version.json and env.js revalidatable', async () => {
		expect(await run('/_app/version.json')).toBe('no-cache, no-store, must-revalidate')
		expect(await run('/_app/env.js')).toBeNull() // static asset ext, left to the app
	})

	it('never caches HTML pages and API responses', async () => {
		expect(await run('/some/page')).toBe('no-cache, no-store, must-revalidate')
		expect(await run('/api/tasks')).toBe('no-cache, no-store, must-revalidate')
	})

	it('leaves other 200 static assets untouched', async () => {
		expect(await run('/favicon.png')).toBeNull()
	})
})
