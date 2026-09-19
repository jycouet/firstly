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

const UNDEFINED_TABLE = '42P01'
const UNDEFINED_COLUMN = '42703'
const MAX_CANDIDATES = 3

type PgError = { code?: string; hint?: string; position?: string; message?: string }

/** Comparison key: an unquoted identifier is folded to lowercase, and `_` is how the same name is spelled in snake_case. */
const norm = (s: string) => s.toLowerCase().replace(NON_ALPHANUM, '')

function distance(a: string, b: string): number {
	if (a === b) return 0
	let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
	for (let i = 1; i <= a.length; i++) {
		const row = [i]
		for (let j = 1; j <= b.length; j++) {
			row[j] = Math.min(
				prev[j] + 1,
				row[j - 1] + 1,
				prev[j - 1] + (a[i - 1] === b[i - 1] ? 0 : 1),
			)
		}
		prev = row
	}
	return prev[b.length]
}

/** Same name modulo case/underscores wins; otherwise a typo's worth of distance, scaled to the name length. */
function closest(wanted: string, candidates: { label: string; name: string }[]): string[] {
	const target = norm(wanted)
	const exact = candidates.filter((c) => norm(c.name) === target)
	if (exact.length) return exact.slice(0, MAX_CANDIDATES).map((c) => c.label)
	const budget = target.length <= 4 ? 1 : target.length <= 8 ? 2 : 3
	return candidates
		.map((c) => ({ label: c.label, d: distance(target, norm(c.name)) }))
		.filter((c) => c.d <= budget)
		.sort((a, b) => a.d - b.d)
		.slice(0, MAX_CANDIDATES)
		.map((c) => c.label)
}

async function catalog(db: SqlDatabase, sql: string): Promise<any[]> {
	try {
		return (await db.execute(sql)).rows ?? []
	} catch {
		// Not Postgres, no catalog access, connection gone: the plain error is still useful.
		return []
	}
}

async function suggest(db: SqlDatabase, err: PgError): Promise<string[]> {
	const message = err.message ?? ''

	if (err.code === UNDEFINED_TABLE) {
		const wanted = RELATION_MISSING.exec(message)?.[1]
		if (!wanted) return []
		const rows = await catalog(
			db,
			`select table_name from information_schema.tables where table_schema not in ('pg_catalog', 'information_schema')`,
		)
		return closest(wanted.split('.').at(-1)!, rows.map((r) => ({ label: `"${r.table_name}"`, name: r.table_name })))
	}

	if (err.code === UNDEFINED_COLUMN) {
		const wanted = COLUMN_MISSING.exec(message)?.[1]
		if (!wanted) return []
		const rows = await catalog(
			db,
			`select table_name, column_name from information_schema.columns where table_schema not in ('pg_catalog', 'information_schema')`,
		)
		return closest(
			wanted.split('.').at(-1)!,
			rows.map((r) => ({ label: `"${r.table_name}"."${r.column_name}"`, name: r.column_name })),
		)
	}

	return []
}

/**
 * Never throws and never hides the original message - the returned error is the
 * one to rethrow, with the code and any hint appended.
 */
export async function enrichSqlError(db: SqlDatabase, err: unknown): Promise<unknown> {
	if (!(err instanceof Error)) return err
	const pg = err as Error & PgError
	if (!pg.code) return err

	const parts = [pg.message]
	if (pg.hint) parts.push(pg.hint)
	else {
		const found = await suggest(db, pg)
		if (found.length) parts.push(`Did you mean ${found.join(' or ')}?`)
	}
	parts.push(`[${pg.code}${pg.position ? ` at ${pg.position}` : ''}]`)

	const out = new Error(parts.join(' · '))
	Object.assign(out, { code: pg.code, hint: pg.hint, position: pg.position, cause: err })
	return out
}
