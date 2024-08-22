import { expect, test } from 'vitest'

import { remult } from 'remult'

import { buildWhere, cellsBuildor, fieldsOf, getPlaceholder } from './cellsBuildor.js'
import { FF_Entity } from './virtual/FF_Entity.js'

const repo = remult.repo(FF_Entity)
test('getPlaceholder', () => {
  expect(
    getPlaceholder([
      //
      repo.fields.email,
      repo.fields.password,
    ]),
  ).toMatchInlineSnapshot('"E Mail, Mot de passe"')
})

test('where with search', () => {
  const where = buildWhere(undefined, undefined, [], [repo.fields.email], {
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

test('where without search, with enum', () => {
  const where = buildWhere(undefined, undefined, [], [repo.fields.email], {
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
  const where = buildWhere(undefined, { isSubContractor: true }, [], [repo.fields.email], {
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
  const cells = cellsBuildor(repo, ['email', 'password'])
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
