import kitql from '@kitql/eslint-config'

/** @type { import("eslint").Linter.Config } */
export default [
  ...kitql,
  {
    name: 'firstly:ignores',
    ignores: ['**/lib/auth/static/assets/'],
  },
  {
    name: 'firstly:rules',
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]
