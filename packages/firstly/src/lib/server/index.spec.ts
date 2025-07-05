import { describe, expect, it } from 'vitest'

import { ModuleFF, modulesFlatAndOrdered } from '.'
import { auth } from '../auth/server'

describe('api', () => {
	it('flatten modules', () => {
		const modules: ModuleFF[] = [
			new ModuleFF({
				name: 'init',
				modulesFF: [new ModuleFF({ name: 'a' }), new ModuleFF({ name: 'b' })],
			}),
			new ModuleFF({ name: 'main' }),
			auth({}),
			new ModuleFF({ name: 'main last', priority: 100 }),
			new ModuleFF({ name: 'prio', priority: -1000 }),
			new ModuleFF({
				name: 'the end',
				modulesFF: [new ModuleFF({ name: 'd' }), new ModuleFF({ name: 'c' })],
			}),
		]

		console.time('flatten')
		const res = modulesFlatAndOrdered(modules)
		console.timeEnd('flatten')
		expect(res).toMatchInlineSnapshot(`
      [
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | prio",
            "withDate": null,
          },
          "name": "prio",
          "priority": -1000,
        },
        {
          "controllers": [
            [Function],
          ],
          "entities": [
            [Function],
            [Function],
            [Function],
          ],
          "initApi": [Function],
          "initRequest": [Function],
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | auth",
            "withDate": null,
          },
          "name": "auth",
          "priority": -777,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | init",
            "withDate": null,
          },
          "name": "init",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | a",
            "withDate": null,
          },
          "name": "init-a",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | b",
            "withDate": null,
          },
          "name": "init-b",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | main",
            "withDate": null,
          },
          "name": "main",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | the end",
            "withDate": null,
          },
          "name": "the end",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | d",
            "withDate": null,
          },
          "name": "the end-d",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | c",
            "withDate": null,
          },
          "name": "the end-c",
          "priority": undefined,
        },
        {
          "controllers": undefined,
          "entities": undefined,
          "initApi": undefined,
          "initRequest": undefined,
          "log": Log {
            "levelsToShow": 3,
            "prefixEmoji": "",
            "toolName": "firstly | main last",
            "withDate": null,
          },
          "name": "main last",
          "priority": 100,
        },
      ]
    `)
	})

	it('flatten modules', () => {
		const res = modulesFlatAndOrdered([])
		expect(res).toMatchInlineSnapshot(`[]`)
	})
})
