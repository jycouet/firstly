#!/usr/bin/env node
// Run SQL against a running app with a firstly sql token (`sqlAdmin({ tokens })`).
// Plain JS, shipped as-is: it must run from node_modules/.bin with no build step.
import { Console } from 'node:console'
import { text } from 'node:stream/consumers'

const HELP = `ff-sql - run SQL through a firstly sql token

  FF_SQL_TOKEN=ffsql_… FF_SQL_ORIGIN=https://example.com ff-sql "select 1"
  ff-sql --json "select * from users limit 3"
  ff-sql <<'SQL'
    select handle from "users" where "createdAt" > now() - interval '7 days'
  SQL

  --json        raw JSON instead of a table
  --origin=URL  overrides FF_SQL_ORIGIN
  --api-path=P  remult api root (default /api)
  --help, -h    this

Mint a token in the app's <SqlTokens /> page. Reads run inside a READ ONLY
transaction, one statement per call. Identifiers usually come from entity
classes, so they are camelCase and need double quotes: "createdAt", not
created_at. A heredoc avoids fighting the shell over single quotes.`

const TRAILING_SLASH = /\/$/

const KNOWN = ['json', 'origin', 'api-path', 'help']

const args = process.argv.slice(2)
const flag = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))
const value = (name, fallback) => flag(name)?.split('=').slice(1).join('=') || fallback

if (flag('help') || args.includes('-h') || (args.length === 0 && process.stdin.isTTY)) {
	console.info(HELP)
	process.exit(flag('help') || args.includes('-h') ? 0 : 2)
}

// A typo'd flag must not be silently dropped from the SQL: `--jsno "select 1"`
// would otherwise run and quietly print a table.
const unknown = args.filter((a) => a.startsWith('--') && !KNOWN.includes(a.slice(2).split('=')[0]))
if (unknown.length) {
	console.error(`unknown flag ${unknown.join(' ')}. ff-sql --help`)
	process.exit(2)
}

const token = process.env.FF_SQL_TOKEN
const origin = value('origin', process.env.FF_SQL_ORIGIN)
const apiPath = value('api-path', '/api')

if (!token) {
	console.error('FF_SQL_TOKEN missing - mint one in the app (<SqlTokens />). ff-sql --help')
	process.exit(2)
}
if (!origin) {
	console.error('FF_SQL_ORIGIN missing - the app to query, e.g. https://example.com')
	process.exit(2)
}

const cmd = (
	args.filter((a) => !a.startsWith('--')).join(' ') || (await text(process.stdin))
).trim()
if (!cmd) {
	console.error('no sql given. ff-sql --help')
	process.exit(2)
}

let res
try {
	res = await fetch(`${origin.replace(TRAILING_SLASH, '')}${apiPath}/ff/sqlAdmin/exec`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({ args: [cmd] }),
	})
} catch (err) {
	console.error(`${origin} unreachable: ${err.message}`)
	process.exit(1)
}

const body = await res.json().catch(() => null)
if (!res.ok) {
	// 403 here is almost always a dead token: expired, revoked, or minted elsewhere.
	console.error(`${res.status} ${body?.message ?? res.statusText}`)
	process.exit(1)
}

const { rows, rowCount, took } = body.data ?? body
// Table and rows on stdout, the summary on stderr, so `| jq` and `> file` stay clean.
const out = new Console(process.stdout)
if (flag('json')) out.log(JSON.stringify(rows, null, 2))
else if (rowCount) out.table(rows)
console.error(`${rowCount} row(s) · ${Math.round(took)} ms`)
