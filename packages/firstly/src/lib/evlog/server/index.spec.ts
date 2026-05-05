import { describe, expect, it } from 'vitest'

import type { EvlogPlugin } from 'evlog'

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
})
