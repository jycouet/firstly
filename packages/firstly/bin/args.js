// Pure arg parsing for `ff-sql`, split out so it can be tested without running
// the cli. Plain JS like its caller: bin/ ships unbuilt.

/** Flags that take no value. */
const BOOLEAN = ['json', 'help']
/** Flags that need one, as `--x=y` or `--x y`. */
const VALUED = ['origin', 'api-path']

const camel = { 'api-path': 'apiPath' }

/**
 * @param {string[]} argv
 * @returns {{ help: boolean, json: boolean, origin?: string, apiPath?: string, sql: string, error?: string }}
 */
export function parseArgs(argv) {
	/** @type {any} */
	const out = { help: false, json: false, sql: '' }
	const positional = []

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === '-h') {
			out.help = true
			continue
		}
		if (!arg.startsWith('--')) {
			positional.push(arg)
			continue
		}
		const eq = arg.indexOf('=')
		const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq)
		const inline = eq === -1 ? undefined : arg.slice(eq + 1)

		if (BOOLEAN.includes(name)) {
			// `--json=false` reading as "json on" is the kind of thing nobody debugs twice.
			if (inline !== undefined) return { ...out, error: `--${name} takes no value` }
			out[name] = true
			continue
		}
		if (VALUED.includes(name)) {
			const value = inline ?? argv[++i]
			// Without this, `--origin http://x "select 1"` sends "http://x select 1" as SQL.
			if (!value || value.startsWith('--')) return { ...out, error: `--${name} needs a value` }
			out[camel[name] ?? name] = value
			continue
		}
		return { ...out, error: `unknown flag --${name}` }
	}

	out.sql = positional.join(' ').trim()
	return out
}
