import { quoteTable } from './ident'

/**
 * Pure planner: diff the live PRIMARY KEYs against what the entity `id` config
 * wants, and emit the minimal ALTER plan. No DB access here - the controller
 * feeds it the catalog snapshot + the metadata-derived target, runs the SQL.
 *
 * Why this exists: Remult only sets a table's PK on first creation and never
 * ALTERs it, so a later `id` change is silently ignored on long-lived DBs.
 */

/** A table's current PK, as read from the pg catalog. */
export type PkCurrent = { table: string; constraintName: string; cols: string[] }

/** A table's desired PK, derived from `repo(Entity).metadata.idMetadata`. */
export type PkDesired = { table: string; cols: string[] }

type PkAction = 'ok' | 'create' | 'migrate' | 'missing'

export type PkPlan = {
	table: string
	before: string[]
	after: string[]
	action: PkAction
	sql: string[]
}

const ident = (name: string) => `"${name}"`
const cols = (names: string[]) => names.map(ident).join(', ')

const sameOrder = (a: string[], b: string[]) =>
	a.length === b.length && a.every((c, i) => c === b[i])

/**
 * One plan per *desired* (entity-backed) table. Tables present in the DB but not
 * in `desired` (firstly infra, views, etc.) are left alone - we only manage what
 * an entity's `id` config describes. Several entities can share one table (a
 * light projection + the full row on the same `dbName`) - one plan per table,
 * first declaration wins, so the UI can key rows by table. `tables` is every live
 * table: an entity whose table was never created is `missing`, not a PK to add.
 */
export function planPkSync(
	current: PkCurrent[],
	desired: PkDesired[],
	tables: ReadonlySet<string>,
): PkPlan[] {
	const byTable = new Map(current.map((c) => [c.table, c]))
	const seen = new Set<string>()

	return desired.flatMap(({ table, cols: after }) => {
		if (seen.has(table)) return []
		seen.add(table)
		if (!tables.has(table)) return [{ table, before: [], after, action: 'missing', sql: [] }]
		return [planTable(byTable.get(table), table, after)]
	})
}

function planTable(cur: PkCurrent | undefined, table: string, after: string[]): PkPlan {
	const before = cur?.cols ?? []
	const addPk = `ALTER TABLE ${quoteTable(table)} ADD PRIMARY KEY (${cols(after)});`

	if (!cur) return { table, before, after, action: 'create', sql: [addPk] }
	if (sameOrder(cur.cols, after)) return { table, before, after, action: 'ok', sql: [] }

	return {
		table,
		before,
		after,
		action: 'migrate',
		sql: [`ALTER TABLE ${quoteTable(table)} DROP CONSTRAINT ${ident(cur.constraintName)};`, addPk],
	}
}
