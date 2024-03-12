/** @type { import("eslint").Linter.FlatConfig } */
module.exports = {
  extends: ['@kitql'],
  rules: {
    // You can add rules here
    'no-undef': 'off',
    'svelte/no-at-html-tags': 'off',
    // 'no-inner-declarations': 'off',
    // 'svelte/no-inner-declarations': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
}
