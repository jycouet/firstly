import { fileURLToPath } from 'node:url'

import { kitql } from '@kitql/eslint-config/.prettierrc.js'

const config = kitql()

export default {
	...config,
	// TODO: drop with @kitql/eslint-config 0.10, it groups # imports with the aliases
	importOrder: config.importOrder.flatMap((o) => (o === '^(\\$)(.*)$' ? [o, '^(#)(.*)$'] : o)),
	tailwindStylesheet: fileURLToPath(new URL('./packages/firstly/src/app.css', import.meta.url)),
}
