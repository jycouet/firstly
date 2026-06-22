/**
 * Sync per-module README.md files into the Astro Starlight docs site.
 *
 * For every `packages/firstly/src/lib/<module>/README.md` it finds, the script
 * writes `docs/src/content/docs/docs/modules/<module>.mdx` with the
 * Starlight-required `--- title: ... ---` frontmatter prepended.
 *
 * Title is derived from the README's first H1 heading (`# Module - Evlog`).
 * Existing target files are overwritten - the README in the module is the
 * source of truth.
 *
 * Wired into `pnpm compile` and `docs:dev` so contributors never edit the
 * generated mdx by hand.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const libDir = resolve(here, '..', 'src', 'lib')
const docsModulesDir = resolve(
	here,
	'..',
	'..',
	'..',
	'docs',
	'src',
	'content',
	'docs',
	'docs',
	'modules',
)

if (!existsSync(docsModulesDir)) {
	mkdirSync(docsModulesDir, { recursive: true })
}

let synced = 0
for (const entry of readdirSync(libDir, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue
	const readmePath = join(libDir, entry.name, 'README.md')
	if (!existsSync(readmePath)) continue

	const md = readFileSync(readmePath, 'utf8')

	const titleMatch = md.match(/^#\s+(.+?)\s*$/m)
	const title = titleMatch ? titleMatch[1].trim() : `Module - ${entry.name}`
	// Drop the H1 from the body since Starlight renders the frontmatter title.
	const body = titleMatch ? md.replace(titleMatch[0], '').replace(/^\s*\n/, '') : md

	const frontmatter = `---\ntitle: ${title}\n---\n\n`
	const out = join(docsModulesDir, `${entry.name}.mdx`)
	writeFileSync(out, frontmatter + body)
	console.info(`  synced ${entry.name}/README.md -> docs/.../${entry.name}.mdx`)
	synced++
}

if (synced === 0) {
	console.info('  no module READMEs found in', libDir)
} else {
	console.info(`done - ${synced} doc page(s) synced`)
}
