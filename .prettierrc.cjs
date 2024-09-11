const {
  //plugins,
  ...prettierConfig
} = require('@kitql/eslint-config/.prettierrc.cjs')

module.exports = {
  ...prettierConfig,
  // tabWidth: 1,
  // useTabs: true,
}
