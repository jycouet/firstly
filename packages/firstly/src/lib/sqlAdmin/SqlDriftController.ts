import { BackendMethod, remult, SqlDatabase, type ClassType } from 'remult'

import { SERVER_ONLY, SQL_ADMINS } from './SqlAdminController'

export type SqlDriftFlag = 'relationIndexes' | 'primaryKeys' | 'nullable' | 'orphanColumns'

export type SqlDriftOptions = {
	/** Every registered entity. A getter, since the module list usually holds `sqlAdmin()` itself. */
	entities: () => ClassType<unknown>[]
	/** Index `toOne` FK columns not already covered by an index (the PK counts). */
	relationIndexes?: boolean
	/** Re-align live PRIMARY KEYs with each entity `id` config. */
	primaryKeys?: boolean
	/** Relax `not null default ''` columns whose field is now `allowNull` (text: `''` -> NULL). */
	nullable?: boolean
	/** Drop live columns no entity field declares. */
	orphanColumns?: boolean
}

type Column = { table: string; column: string }

export class SqlDriftController {
	/** Set by the `sqlAdmin()` module's `initApi`. */
	static options?: SqlDriftOptions
	static dp?: SqlDatabase

	private static ctx(flag: SqlDriftFlag) {
		const o = SqlDriftController.options
		if (!o?.[flag]) throw new Error(`sqlAdmin({ drift: { ${flag}: true } }) is not enabled`)
		return { db: SqlDriftController.dp ?? SqlDatabase.getDb(), entities: o.entities() }
	}

	@BackendMethod({ allowed: () => remult.isAllowed(SQL_ADMINS), apiPrefix: 'ff/sqlAdmin' })
	static async driftFlags(): Promise<Record<SqlDriftFlag, boolean>> {
		const o = SqlDriftController.options
		return {
			relationIndexes: !!o?.relationIndexes,
			primaryKeys: !!o?.primaryKeys,
			nullable: !!o?.nullable,
			orphanColumns: !!o?.orphanColumns,
		}
	}

	// Each apply shares the BackendMethod transaction: any failure rolls every statement back.
	@BackendMethod({ allowed: () => remult.isAllowed(SQL_ADMINS), apiPrefix: 'ff/sqlAdmin' })
	static async relationIndexes(opts?: { apply?: boolean }) {
		if (import.meta.env.SSR) {
			const { db, entities } = SqlDriftController.ctx('relationIndexes')
			const { createRelationIndexes } = await import('./server/drift/relationIndexes')
			return createRelationIndexes(db, entities, opts)
		}
		throw new Error(SERVER_ONLY)
	}

	@BackendMethod({ allowed: () => remult.isAllowed(SQL_ADMINS), apiPrefix: 'ff/sqlAdmin' })
	static async primaryKeys(opts?: { apply?: boolean }) {
		if (import.meta.env.SSR) {
			const { db, entities } = SqlDriftController.ctx('primaryKeys')
			const { reindexPrimaryKeys } = await import('./server/drift/primaryKeys')
			return reindexPrimaryKeys(db, entities, opts)
		}
		throw new Error(SERVER_ONLY)
	}

	@BackendMethod({ allowed: () => remult.isAllowed(SQL_ADMINS), apiPrefix: 'ff/sqlAdmin' })
	static async nullable(opts?: { apply?: boolean; columns?: Column[] }) {
		if (import.meta.env.SSR) {
			const { db, entities } = SqlDriftController.ctx('nullable')
			const { syncNullable } = await import('./server/drift/nullable')
			return syncNullable(db, entities, opts)
		}
		throw new Error(SERVER_ONLY)
	}

	@BackendMethod({ allowed: () => remult.isAllowed(SQL_ADMINS), apiPrefix: 'ff/sqlAdmin' })
	static async orphanColumns(opts?: { apply?: boolean; columns?: Column[] }) {
		if (import.meta.env.SSR) {
			const { db, entities } = SqlDriftController.ctx('orphanColumns')
			const { dropColumns } = await import('./server/drift/orphanColumns')
			return dropColumns(db, entities, opts)
		}
		throw new Error(SERVER_ONLY)
	}
}
