import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

const sources = [
	{
		from: 'packages/firstly/src/boutique/auth/README.md',
		to: 'docs/src/content/docs/docs/modules/auth.md',
	},
]

for (const { from, to } of sources) {
	const fromAbs = resolve(repoRoot, from)
	const toAbs = resolve(repoRoot, to)
	mkdirSync(dirname(toAbs), { recursive: true })
	copyFileSync(fromAbs, toAbs)
	console.info(`[sync-external-docs] ${from} -> ${to}`)
}
