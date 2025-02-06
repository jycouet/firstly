import { describe, expect, it } from 'vitest'

import { auth } from '$lib/auth/server'

import { Module, modulesFlatAndOrdered } from '.'

describe('api', () => {
  it('flatten modules', () => {
    const modules: Module[] = [
      new Module({ name: 'init', modules: [new Module({ name: 'a' }), new Module({ name: 'b' })] }),
      new Module({ name: 'main' }),
      auth({}),
      new Module({ name: 'main last', priority: 100 }),
      new Module({ name: 'prio', priority: -1000 }),
      new Module({
        name: 'the end',
        modules: [new Module({ name: 'd' }), new Module({ name: 'c' })],
      }),
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
