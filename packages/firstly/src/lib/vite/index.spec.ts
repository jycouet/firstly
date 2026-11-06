import { kitRoutes } from 'vite-plugin-kit-routes'
import { describe, expect, it, vi } from 'vitest'

import { firstly } from './index'

vi.mock('vite-plugin-kit-routes', async (original) => {
	const actual = await original<typeof import('vite-plugin-kit-routes')>()
	return { ...actual, kitRoutes: vi.fn(actual.kitRoutes) }
})

async function clientTransform(code: string) {
	const plugins = (firstly() as any[]).flat(Infinity)
	const stripper = plugins.find((p) => p?.name === 'vite-plugin-stripper')
	return stripper.transform.handler(code, 'src/Task.ts', { ssr: false })
}

describe('firstly', () => {
	it('enables legacy decorators', () => {
		const plugins = (firstly() as any[]).flat(Infinity)
		const plugin = plugins.find((p) => p?.name === 'vite-plugin-firstly')
		expect(plugin.config().oxc.decorator.legacy).toBe(true)
	})

	it('keys routes by route id unless the app says otherwise', () => {
		firstly()
		expect(kitRoutes).toHaveBeenLastCalledWith(
			expect.objectContaining({ format_page_route_id: true }),
		)

		firstly({ kitRoutes: { format_page_route_id: false } })
		expect(kitRoutes).toHaveBeenLastCalledWith(
			expect.objectContaining({ format_page_route_id: false }),
		)
	})

	it.each(['$app/env/private', '$env/static/private', '$env/dynamic/private'])(
		'nullifies %s on the client by default',
		async (mod) => {
			const res = await clientTransform(`import { SECRET } from '${mod}'\nconsole.log(SECRET)`)
			expect(res.code).not.toContain(mod)
			expect(res.code).toContain('SECRET = null')
		},
	)
})
