// Pure arg parsing for `ff-sql`, split out so it can be tested without running
// the cli. Plain JS like its caller: bin/ ships unbuilt.

/** Flags that take no value. */
const BOOLEAN = ['json', 'help']
/** Flags that need one, as `--x=y` or `--x y`. */
const VALUED = ['origin', 'api-path']

const camel = { 'api-path': 'apiPath' }

/** `--name` / `--name=value`. `-- comment` is SQL, not a flag. */
const FLAG = /^--[a-z][\w-]*(=|$)/

/**
 * @param {string[]} argv
 * @returns {{ help: boolean, json: boolean, origin?: string, apiPath?: string, sql: string, error?: string }}
 */
export function parseArgs(argv) {
	/** @type {any} */
	const out = { help: false, json: false, sql: '' }
	const positional = []
	const seen = new Set()

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === '-h') {
			out.help = true
			continue
		}
		if (arg === '--') {
			positional.push(...argv.slice(i + 1))
			break
		}
		// A `-- comment` line is SQL: only a flag-shaped token is read as a flag.
		if (!FLAG.test(arg)) {
			positional.push(arg)
			continue
		}
		const eq = arg.indexOf('=')
		const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
		const inline = eq === -1 ? undefined : arg.slice(eq + 1)

		const key = camel[name] ?? name
		if (seen.has(key)) return { ...out, error: `--${name} given twice` }

		if (BOOLEAN.includes(name)) {
			// `--json=false` reading as "json on" is the kind of thing nobody debugs twice.
			if (inline !== undefined) return { ...out, error: `--${name} takes no value` }
			seen.add(key)
			out[key] = true
			continue
		}
		if (VALUED.includes(name)) {
			const value = inline ?? argv[++i]
			// Without this, `--origin http://x "select 1"` sends "http://x select 1" as SQL.
			if (!value || FLAG.test(value)) return { ...out, error: `--${name} needs a value` }
			seen.add(key)
			out[key] = value
			continue
		}
		return { ...out, error: `unknown flag --${name}` }
	}

	out.sql = positional.join(' ').trim()
	return out
}
