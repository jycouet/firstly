import { kitql } from '@kitql/eslint-config/.prettierrc.js'

export default {
	...kitql(),
	tailwindConfig: './packages/firstly/tailwind.config.cjs',
}
