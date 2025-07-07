import { expect, test } from 'vitest'

import { repo } from 'remult'

import { UIEntity } from '../virtual/UIEntity.js'
import { buildWhere, cellsBuildor, fieldsOf, getPlaceholder } from './cellsBuildor.js'

const repoUi = repo(UIEntity)
test('getPlaceholder', () => {
	expect(
		getPlaceholder([
			//
			repoUi.fields.email,
			repoUi.fields.password,
		]),
	).toMatchInlineSnapshot('"E Mail, Mot de passe"')
})

test('where with search', () => {
	const where = buildWhere(undefined, undefined, [], [repoUi.fields.email], {
		email: 'jyc@test.com',
		search: 'jyc test',
	})
	expect(where).toMatchInlineSnapshot(`
    {
      "$and": [
        {
          "$or": [
            {
              "$and": [
                {
                  "email": {
                    "$contains": "jyc",
                  },
                },
                {
                  "email": {
                    "$contains": "test",
                  },
                },
              ],
            },
          ],
        },
      ],
    }
  `)
})

test('where with 2 search', () => {
	const where = buildWhere(undefined, undefined, [], [repoUi.fields.email, repoUi.fields.state], {
		email: 'jyc@test.com',
		search: 'jyc test',
	})
	expect(where).toMatchInlineSnapshot(`
    {
      "$and": [
        {
          "$or": [
            {
              "$and": [
                {
                  "email": {
                    "$contains": "jyc",
                  },
                },
                {
                  "email": {
                    "$contains": "test",
                  },
                },
              ],
            },
            {
              "$and": [
                {
                  "state": {
                    "$contains": "jyc",
                  },
                },
                {
                  "state": {
                    "$contains": "test",
                  },
                },
              ],
            },
          ],
        },
      ],
    }
  `)
})

test('where without search, with enum', () => {
	const where = buildWhere(undefined, undefined, [], [repoUi.fields.email], {
		email: 'jyc@test.com',
		civilite: 'MADAME',
	})
	expect(where).toMatchInlineSnapshot(`
		{
		  "$and": [],
		}
	`)
})

test('with default where', () => {
	const where = buildWhere(undefined, { isSubContractor: true }, [], [repoUi.fields.email], {
		email: 'jyc@test.com',
		civilite: 'MADAME',
	})
	expect(where).toMatchInlineSnapshot(`
    {
      "$and": [
        {
          "isSubContractor": true,
        },
      ],
    }
  `)
})

test('cellsBuildor', () => {
	const cells = cellsBuildor(repoUi, ['email', 'password'])
	// Let's get the selection done
	expect(fieldsOf(cells).map((c) => c.key)).toMatchInlineSnapshot(`
		[
		  "email",
		  "password",
		]
	`)
	// Let's look at the 3 captions for now
	expect(getPlaceholder(fieldsOf(cells))).toMatchInlineSnapshot(`"E Mail, Mot de passe"`)
})
