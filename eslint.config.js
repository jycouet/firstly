import { kitql } from '@kitql/eslint-config'

/** @type { import("eslint").Linter.Config[] } */
export default [
	...kitql({ pnpmCatalogs: { enable: false } }),
	{
		name: 'firstly:ignores',
		ignores: ['**/lib/auth/static/assets/'],
	},
	{
		name: 'firstly:rules',
		rules: {
			'no-empty': ['error', { allowEmptyCatch: true }],

			'svelte/no-reactive-reassign': 'off',
			'svelte/no-immutable-reactive-statements': 'off',
			'svelte/require-each-key': 'off',
		},
	},
]
