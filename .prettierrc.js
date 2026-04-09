import { fileURLToPath } from 'node:url'

import { kitql } from '@kitql/eslint-config/.prettierrc.js'

export default {
	...kitql(),
	tailwindStylesheet: fileURLToPath(new URL('./packages/firstly/src/app.css', import.meta.url)),
}
