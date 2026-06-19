// Copies skills from `.claude/skills/*` into `docs/public/.well-known/agent-skills/`
// so `npx skills add https://firstly.fun` can discover them.
// See: https://github.com/vercel-labs/skills (well-known provider)

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const skillsSrc = join(repoRoot, '.claude/skills')
const wellKnownDst = join(repoRoot, 'docs/public/.well-known/agent-skills')

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/
const DESCRIPTION_RE = /^description:\s*(.*)$/m
const NEWLINE_RE = /\r?\n/
const FM_KEY_VALUE_RE = /^([A-Za-z0-9_-]+):\s+(.*)$/
const COLON_SPACE_RE = /:\s/

// The `skills` CLI parses SKILL.md frontmatter with a strict YAML parser. An
// unquoted scalar containing `: ` (colon + space) is read as a nested mapping
// and throws, so `npx skills add https://firstly.fun` silently finds 0 skills.
// Catch that here so a bad description fails the build instead of the endpoint.
function assertParsableFrontmatter(skillName, fm) {
	for (const line of fm.split(NEWLINE_RE)) {
		const m = line.match(FM_KEY_VALUE_RE)
		if (!m) continue
		const value = m[2]
		if (value.startsWith('"') || value.startsWith("'")) continue // already quoted
		if (COLON_SPACE_RE.test(value)) {
			throw new Error(
				`skill "${skillName}": frontmatter \`${m[1]}\` contains a colon followed by a space ` +
					`("${value}"). This breaks the YAML parser used by \`npx skills add\`. ` +
					`Quote the value or remove the colon-space.`,
			)
		}
	}
}

rmSync(wellKnownDst, { recursive: true, force: true })
mkdirSync(wellKnownDst, { recursive: true })

const entries = readdirSync(skillsSrc, { withFileTypes: true }).filter((e) => e.isDirectory())

const skills = entries.map((entry) => {
	const srcDir = join(skillsSrc, entry.name)
	const dstDir = join(wellKnownDst, entry.name)
	cpSync(srcDir, dstDir, { recursive: true })

	const files = readdirSync(srcDir, { recursive: true, withFileTypes: true })
		.filter((f) => f.isFile())
		.map((f) =>
			join(f.parentPath ?? f.path, f.name)
				.slice(srcDir.length + 1)
				.replaceAll('\\', '/'),
		)

	const skillMd = readFileSync(join(srcDir, 'SKILL.md'), 'utf8')
	const fm = skillMd.match(FRONTMATTER_RE)?.[1] ?? ''
	assertParsableFrontmatter(entry.name, fm)
	const description = fm.match(DESCRIPTION_RE)?.[1]?.trim() ?? ''

	return { name: entry.name, description, files }
})

writeFileSync(join(wellKnownDst, 'index.json'), JSON.stringify({ skills }, null, 2) + '\n')

console.info(`✔ synced ${skills.length} skill(s) to ${wellKnownDst}`)
