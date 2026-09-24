/**
 * Pure planner: diff each entity-backed table's live columns against the columns
 * its entity actually declares, and list the orphans - live columns with no
 * matching field. No DB access here; the executor feeds it the catalog snapshot +
 * the metadata-derived target, and runs the (user-selected subset of) drops.
 *
 * Why this exists: Remult's auto-schema only ever ADDs columns, never drops them,
 * so a field removed from an entity leaves its column behind forever. This is the
 * inverse of `planPkSync` / `planRelationIndexes` - and it's destructive, so the
 * UI selects nothing by default and applies only the checked subset.
 */

/** A table's columns - live (from the catalog) or declared (from metadata). */
export type TableColumns = { table: string; columns: string[] }

/** One orphan column to (optionally) drop. */
export type DropPlan = { table: string; column: string }

/**
 * One entry per orphan column. Only tables present in `known` (i.e. backed by an
 * entity) are considered - DB-only tables (firstly infra, views) are left alone,
 * same scoping as the other two flows. Sorted by table, then column.
 */
export function planDropColumns(current: TableColumns[], known: TableColumns[]): DropPlan[] {
	// Union, not overwrite: several entities can map to one table (e.g. a light
	// projection + the full row sharing a `dbName`), and each declares only its
	// own subset of the columns.
	const knownByTable = new Map<string, Set<string>>()
	for (const { table, columns } of known) {
		let set = knownByTable.get(table)
		if (!set) knownByTable.set(table, (set = new Set()))
		for (const c of columns) set.add(c)
	}

	const plans: DropPlan[] = []
	for (const { table, columns } of current) {
		const declared = knownByTable.get(table)
		if (!declared) continue // table has no backing entity - not ours to manage
		for (const column of columns) if (!declared.has(column)) plans.push({ table, column })
	}

	return plans.sort((a, b) => a.table.localeCompare(b.table) || a.column.localeCompare(b.column))
}
