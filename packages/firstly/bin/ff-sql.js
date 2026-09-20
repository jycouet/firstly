#!/usr/bin/env node
// Run SQL against a running app with a firstly sql token (`sqlAdmin({ tokens })`).
// Plain JS, shipped as-is: it must run from node_modules/.bin with no build step.
import { Console } from 'node:console'
import { text } from 'node:stream/consumers'

import { parseArgs } from './args.js'

const HELP = `ff-sql - run SQL through a firstly sql token

  FF_SQL_TOKEN=ffsql_… ff-sql --origin=https://example.com "select 1"
  ff-sql --json "select * from users limit 3"
  ff-sql <<'SQL'
    select handle from "users" where "createdAt" > now() - interval '7 days'
  SQL

  --json          raw JSON instead of a table
  --origin=URL    the app to query (or FF_SQL_ORIGIN)
  --api-path=P    remult api root (default /api)
  --help, -h      this

The app's <SqlTokens /> page hands you the whole command, token included -
nothing to configure here. Reads run inside a READ ONLY transaction, one
statement per call. Identifiers usually come from entity classes, so they are
camelCase and need double quotes: "createdAt", not created_at. A heredoc avoids
fighting the shell over single quotes.`

const TRAILING_SLASH = /\/$/

const cli = parseArgs(process.argv.slice(2))

if (cli.help) {
	console.info(HELP)
	process.exit(0)
}
if (cli.error) {
	console.error(`${cli.error}. ff-sql --help`)
	process.exit(2)
}

const token = process.env.FF_SQL_TOKEN
const origin = cli.origin ?? process.env.FF_SQL_ORIGIN
const apiPath = cli.apiPath ?? '/api'

if (!token) {
	console.error('FF_SQL_TOKEN missing - mint one in the app (<SqlTokens />). ff-sql --help')
	process.exit(2)
}
if (!origin) {
	console.error('origin missing - --origin=https://example.com, or FF_SQL_ORIGIN')
	process.exit(2)
}

// Only read stdin when there is nothing else to run: on a tty that would hang.
let cmd = cli.sql
if (!cmd && !process.stdin.isTTY) cmd = (await text(process.stdin)).trim()
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
if (cli.json) out.log(JSON.stringify(rows, null, 2))
else if (rowCount) out.table(rows)
console.error(`${rowCount ?? 0} row(s) · ${Math.round(took ?? 0)} ms`)
