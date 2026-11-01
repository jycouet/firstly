import { describe, expect, it } from 'vitest'

import { firstly } from './index'

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

	it.each(['$app/env/private', '$env/static/private', '$env/dynamic/private'])(
		'nullifies %s on the client by default',
		async (mod) => {
			const res = await clientTransform(`import { SECRET } from '${mod}'\nconsole.log(SECRET)`)
			expect(res.code).not.toContain(mod)
			expect(res.code).toContain('SECRET = null')
		},
	)
})
