import type { EvlogPlugin } from 'evlog'
import { describe, expect, it } from 'vitest'

import { evlog } from './index.js'

describe('evlog() factory', () => {
	it('returns { module, handle, config }', () => {
		const ev = evlog({ service: 'test' })
		expect(ev.module).toBeTypeOf('object')
		expect(ev.handle).toBeTypeOf('function')
		expect(ev.config).toBeTypeOf('object')
		expect(ev.config.service).toBe('test')
	})

	it('config.plugins includes firstly-audit and firstly-trace by default', () => {
		const ev = evlog({ service: 'x' })
		const names = (ev.config.plugins ?? []).map((p: EvlogPlugin) => p.name)
		expect(names).toContain('firstly-audit')
		expect(names).toContain('firstly-trace')
	})

	it('user-supplied plugins are appended after firstly defaults', () => {
		const myPlugin: EvlogPlugin = { name: 'mine', drain: async () => {} }
		const ev = evlog({ service: 'x', plugins: [myPlugin] })
		const names = (ev.config.plugins ?? []).map((p: EvlogPlugin) => p.name)
		expect(names).toEqual(['firstly-audit', 'firstly-trace', 'mine'])
	})

	it('a single user-supplied drain lands on config.drain unchanged', () => {
		const myDrain = async () => {}
		const ev = evlog({ service: 'x', drains: [myDrain] })
		expect(ev.config.drain).toBe(myDrain)
	})

	it('multiple user-supplied drains are composed into config.drain', () => {
		const a = async () => {}
		const b = async () => {}
		const ev = evlog({ service: 'x', drains: [a, b] })
		expect(ev.config.drain).toBeTypeOf('function')
		expect(ev.config.drain).not.toBe(a)
		expect(ev.config.drain).not.toBe(b)
	})

	it('audit.enabled: false drops the audit plugin', () => {
		const ev = evlog({ service: 'x', audit: { enabled: false } })
		const names = (ev.config.plugins ?? []).map((p: EvlogPlugin) => p.name)
		expect(names).not.toContain('firstly-audit')
		expect(names).toContain('firstly-trace')
	})

	it('trace.enabled: false drops the trace plugin', () => {
		const ev = evlog({ service: 'x', trace: { enabled: false } })
		const names = (ev.config.plugins ?? []).map((p: EvlogPlugin) => p.name)
		expect(names).toContain('firstly-audit')
		expect(names).not.toContain('firstly-trace')
	})

	it('no context leaves config.enrich undefined', () => {
		const ev = evlog({ service: 'x' })
		expect(ev.config.enrich).toBeUndefined()
	})

	it('context.userAgent wires an enricher that populates event.userAgent', async () => {
		const ev = evlog({ service: 'x', context: { userAgent: true } })
		expect(ev.config.enrich).toBeTypeOf('function')
		const ctx = {
			event: {} as Record<string, unknown>,
			headers: {
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
		}
		await ev.config.enrich!(ctx as never)
		expect((ctx.event.userAgent as { browser?: { name?: string } }).browser?.name).toBe('Chrome')
	})

	it('context.userAgent still runs the user-supplied enrich', async () => {
		let called = false
		const ev = evlog({
			service: 'x',
			context: { userAgent: true },
			enrich: () => {
				called = true
			},
		})
		await ev.config.enrich!({ event: {}, headers: {} } as never)
		expect(called).toBe(true)
	})
})
