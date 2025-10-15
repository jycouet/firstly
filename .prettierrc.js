import { kitql } from '@kitql/eslint-config/.prettierrc.js'

export default {
	...kitql(),
	tailwindStylesheet: './packages/firstly/src/app.css',
}
