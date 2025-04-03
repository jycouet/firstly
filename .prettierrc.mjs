import { kitql } from '@kitql/eslint-config/.prettierrc.mjs'

export default {
	...kitql(),
	tailwindConfig: './packages/firstly/tailwind.config.cjs',
}
