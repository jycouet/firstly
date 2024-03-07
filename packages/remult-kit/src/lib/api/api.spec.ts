import { describe, expect, it } from 'vitest'

import { auth } from '$lib/auth'

import { modulesFlatAndOrdered, type Module } from '.'

describe('api', () => {
	it('flatten modules', () => {
		const modules: Module[] = [
			{ name: 'init', modules: [{ name: 'a' }, { name: 'b' }] },
			{ name: 'main' },
			auth({}),
			{ name: 'main last', index: 100 },
			{ name: 'prio', index: -1000 },
			{ name: 'the end', modules: [{ name: 'd' }, { name: 'c' }] },
		]

		console.time('flatten')
		const res = modulesFlatAndOrdered(modules)
		console.timeEnd('flatten')
		expect(res).toMatchInlineSnapshot(`
			[
			  {
			    "index": -1000,
			    "name": "prio",
			  },
			  {
			    "controllers": [
			      [Function],
			    ],
			    "earlyReturn": [Function],
			    "entities": [
			      [Function],
			      [Function],
			      [Function],
			    ],
			    "index": -777,
			    "initApi": [Function],
			    "initRequest": [Function],
			    "name": "auth",
			  },
			  {
			    "name": "init",
			  },
			  {
			    "name": "init-a",
			  },
			  {
			    "name": "init-b",
			  },
			  {
			    "name": "main",
			  },
			  {
			    "name": "the end",
			  },
			  {
			    "name": "the end-d",
			  },
			  {
			    "name": "the end-c",
			  },
			  {
			    "index": 100,
			    "name": "main last",
			  },
			]
		`)
	})

	it('flatten modules', () => {
		const res = modulesFlatAndOrdered([])
		expect(res).toMatchInlineSnapshot(`[]`)
	})
})
