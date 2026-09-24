import { kitql } from '@kitql/eslint-config'

/** @type { import("eslint").Linter.Config[] } */
export default [
	...kitql({
		// pnpmCatalogs: { enable: false },
	}),
	{
		name: 'firstly:ignores',
		ignores: [
			'**/lib/auth/static/assets/',
			// FIXME !!!
			'*.svelte.ts',
			'**/*.svelte.ts',
		],
	},
	{
		name: 'firstly:rules',
		rules: {
			'no-empty': ['error', { allowEmptyCatch: true }],

			'svelte/no-reactive-reassign': 'off',
			'svelte/no-immutable-reactive-statements': 'off',
			'svelte/require-each-key': 'off',

			// `!import.meta.env.SSR` guards leave server-only code in the client bundle.
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"UnaryExpression[operator='!'] > MemberExpression[property.name='SSR'][object.type='MemberExpression'][object.property.name='env'][object.object.type='MetaProperty']",
					message:
						'Do not use `!import.meta.env.SSR`. Wrap the body in `if (import.meta.env.SSR) { ... } throw new Error(...)` so Vite can tree-shake server-only code from the client bundle.',
				},
			],
		},
	},
]
