import { expect, test } from 'vitest'

import { remult } from 'remult'

import { buildWhere, fieldsOf, getPlaceholder, kitCellsBuildor } from './kitCellsBuildor.js'
import { UIEntity } from './virtual/UIEntity.js'

const repo = remult.repo(UIEntity)
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
  const where = buildWhere(undefined, [], [repo.fields.email], {
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
  const where = buildWhere(undefined, [], [repo.fields.email], {
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
  const where = buildWhere({ isSubContractor: true }, [], [repo.fields.email], {
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

test('kitBuilder', () => {
  const cells = kitCellsBuildor(repo, ['email', 'password'])
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
