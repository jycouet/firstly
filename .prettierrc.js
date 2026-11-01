import { fileURLToPath } from 'node:url'

import { kitql } from '@kitql/eslint-config/.prettierrc.js'

const config = kitql()

export default {
	...config,
	// TODO: move to kitql
	importOrder: config.importOrder.flatMap((o) => (o === '^(\\$)(.*)$' ? [o, '^(#)(.*)$'] : o)),
	tailwindStylesheet: fileURLToPath(new URL('./packages/firstly/src/app.css', import.meta.url)),
}
