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
	const where = buildWhere([], [repo.fields.email], {
		email: 'jyc@test.com',
		search: 'jyc',
	})
	expect(where).toMatchInlineSnapshot(`
		{
		  "$and": [
		    {
		      "$or": [
		        {
		          "email": {
		            "$contains": "jyc",
		          },
		        },
		      ],
		    },
		  ],
		}
	`)
})

test('where without search, with enum', () => {
	const where = buildWhere([], [repo.fields.email], {
		email: 'jyc@test.com',
		civilite: 'MADAME',
	})
	expect(where).toMatchInlineSnapshot(`
		{
		  "$and": [],
		}
	`)
})

test('kitBuilder', () => {
	const cells = kitCellsBuildor(repo)(['email', 'password'])
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
