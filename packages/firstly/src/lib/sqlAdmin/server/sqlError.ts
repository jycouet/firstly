import type { SqlDatabase } from 'remult'

/**
 * Turns "column X does not exist" into something a caller can act on without a
 * second round trip: Postgres' own HINT when it has one, otherwise the closest
 * names taken from the catalog.
 *
 * Why it matters here more than in an app: the callers of `exec` are scripts
 * and AIs writing SQL against a schema they cannot see, and every case observed
 * in the call log was a misremembered identifier - quoted camelCase read as
 * snake_case, a table named in the singular. Postgres already knows the answer
 * (`Perhaps you meant "athleteEraEstimates.estMaxBpm"`) and the raw message
 * throws it away.
 */

const RELATION_MISSING = /relation "([^"]+)" does not exist/
const COLUMN_MISSING = /column "?([\w$.]+)"? does not exist/
const NON_ALPHANUM = /[^a-z0-9]/g

const SQLSTATE = /^[0-9A-Z]{5}$/

const UNDEFINED_TABLE = '42P01'
const UNDEFINED_COLUMN = '42703'
/** SQLSTATE class 08: the connection is gone, so asking it about its catalog only adds a timeout. */
const CONNECTION_CLASS = '08'
const MAX_CANDIDATES = 3
const MIN_MATCH_LENGTH = 3
/** A caller looping on bad SQL must not turn each failure into a catalog scan. */
const CATALOG_TTL_MS = 10_000

type PgError = {
	code?: string
	errno?: number
	syscall?: string
	severity?: string
	routine?: string
	hint?: string
	detail?: string
	position?: string
	message?: string
}

type Candidate = { label: string; name: string; table?: string }

/** Comparison key: an unquoted identifier is folded to lowercase, and `_` is how the same name is spelled in snake_case. */
const norm = (s: string) => s.toLowerCase().replace(NON_ALPHANUM, '')

/** `a.analysisversion` and `public.users` are about their last part. */
const lastPart = (s: string) => s.split('.').at(-1)!

/**
 * Same name modulo case and underscores, then one name being the start of the
 * other - which is what a singular/plural or a truncated guess looks like
 * (`key_value` for `keyValues`). Deliberately not a typo distance: real misses
 * are spellings of the right word, and Postgres already suggests actual typos
 * through its own HINT.
 */
function closest(wanted: string, candidates: Candidate[]): Candidate[] {
	const target = norm(wanted)
	if (target.length < MIN_MATCH_LENGTH) return []
	const exact = candidates.filter((c) => norm(c.name) === target)
	if (exact.length) return exact.slice(0, MAX_CANDIDATES)
	return candidates
		.filter((c) => {
			const n = norm(c.name)
			return n.length >= MIN_MATCH_LENGTH && (n.startsWith(target) || target.startsWith(n))
		})
		.slice(0, MAX_CANDIDATES)
}

/** A column suggestion from a table the query never mentions is noise; keep those last. */
function preferMentioned(candidates: Candidate[], cmd: string): Candidate[] {
	const haystack = norm(cmd)
	const mentioned = candidates.filter((c) => c.table && haystack.includes(norm(c.table)))
	return mentioned.length ? mentioned : candidates
}

const catalogCache = new WeakMap<SqlDatabase, Map<string, { at: number; rows: any[] }>>()

async function catalog(db: SqlDatabase, sql: string): Promise<any[]> {
	let perDb = catalogCache.get(db)
	if (!perDb) catalogCache.set(db, (perDb = new Map()))
	const hit = perDb.get(sql)
	if (hit && Date.now() - hit.at < CATALOG_TTL_MS) return hit.rows
	let rows: any[] = []
	try {
		rows = (await db.execute(sql)).rows ?? []
	} catch {
		// Not Postgres, no catalog access, connection gone: the plain error is still useful.
	}
	perDb.set(sql, { at: Date.now(), rows })
	return rows
}

async function suggest(db: SqlDatabase, err: PgError, cmd: string): Promise<string[]> {
	const message = err.message ?? ''

	if (err.code === UNDEFINED_TABLE) {
		const wanted = RELATION_MISSING.exec(message)?.[1]
		if (!wanted) return []
		const rows = await catalog(
			db,
			`select table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema')`,
		)
		const found = closest(
			lastPart(wanted),
			rows.map((r) => ({ label: `"${r.table_name}"`, name: r.table_name })),
		)
		return found.map((c) => c.label)
	}

	if (err.code === UNDEFINED_COLUMN) {
		const wanted = COLUMN_MISSING.exec(message)?.[1]
		if (!wanted) return []
		const rows = await catalog(
			db,
			`select table_name, column_name from information_schema.columns where table_schema not in ('pg_catalog', 'information_schema')`,
		)
		const found = closest(
			lastPart(wanted),
			rows.map((r) => ({
				label: `"${r.table_name}"."${r.column_name}"`,
				name: r.column_name,
				table: r.table_name,
			})),
		)
		return preferMentioned(found, cmd).map((c) => c.label)
	}

	return []
}

/**
 * Never throws and never hides the original message - the returned error is the
 * one to rethrow, with the code and any hint appended.
 */
export async function enrichSqlError(db: SqlDatabase, err: unknown, cmd = ''): Promise<unknown> {
	if (!(err instanceof Error)) return err
	const pg = err as Error & PgError
	// A SQLSTATE, not any error that happens to carry a `code`: ENOTFOUND is too
	// long to match, but EPIPE and EBUSY have the exact same shape.
	if (!pg.code || !SQLSTATE.test(pg.code) || pg.code.startsWith(CONNECTION_CLASS)) return err
	if (pg.errno !== undefined || pg.syscall !== undefined) return err

	const parts = [pg.message]
	if (pg.hint) parts.push(pg.hint)
	else {
		const found = await suggest(db, pg, cmd)
		if (found.length) parts.push(`Did you mean ${found.join(' or ')}?`)
	}
	if (pg.detail) parts.push(pg.detail)
	parts.push(`[${pg.code}${pg.position ? ` at ${pg.position}` : ''}]`)

	const out = new Error(parts.join(' · '))
	Object.assign(out, {
		code: pg.code,
		hint: pg.hint,
		detail: pg.detail,
		position: pg.position,
		cause: err,
	})
	return out
}
