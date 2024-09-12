import kitql from '@kitql/eslint-config'

/** @type { import("eslint").Linter.Config } */
export default [
  ...kitql,
  {
    ignores: [
      '**/build/',
      '**/.svelte-kit/',
      '**/dist/',
      '**/lib/auth/static/assets/',
      'src/lib/ui/dialog/FormEditAction.svelte.d.ts',
    ],
  },
  {
    name: 'firstly rules',
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]
