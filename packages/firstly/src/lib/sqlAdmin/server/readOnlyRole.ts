import { createHmac, randomBytes } from 'node:crypto'

import type { SqlTokenPool } from '../SqlAdminController'

const NON_IDENT = /[^a-z0-9_]/g
const MAX_IDENT = 63
const DUPLICATE_OBJECT = '42710'

type PgPool = SqlTokenPool & {
	options: Record<string, any>
	query(sql: string): Promise<{ rows: any[] }>
}

const quote = (s: string) => `"${s.replaceAll('"', '""')}"`

export const readOnlyRoleName = (db: string) =>
	`ff_readonly_${db.toLowerCase().replace(NON_IDENT, '_')}`.slice(0, MAX_IDENT)

/** The app's own password: every instance derives the same role password, nothing to store. */
function appSecret(options: Record<string, any>): string | undefined {
	if (options.connectionString) {
		const pw = new URL(options.connectionString).password
		if (pw) return decodeURIComponent(pw)
	}
	if (typeof options.password === 'string' && options.password) return options.password
	return process.env.PGPASSWORD || undefined
}

function withCredentials(options: Record<string, any>, user: string, password: string) {
	const { connectionString, ...rest } = options
	// pg lets the connection string win over `user`/`password`, so rewrite the URL itself.
	if (connectionString) {
		const url = new URL(connectionString)
		url.username = user
		url.password = password
		return { ...rest, connectionString: url.toString(), max: 2 }
	}
	return { ...rest, user, password, max: 2 }
}

/**
 * Upserts a login role that can only SELECT in this database and returns a
 * pool connected as it. Per-database grants rather than `pg_read_all_data`:
 * that one reaches every database of the cluster. Re-run at each boot, so
 * grants follow schemas created since. Needs CREATEROLE on the app role.
 */
export async function ensureReadOnlyPool(app: SqlTokenPool): Promise<SqlTokenPool> {
	const pool = app as PgPool
	if (typeof pool.query !== 'function' || !pool.options) throw new Error('not a pg pool')

	const { rows } = await pool.query('select current_database() as db')
	const db: string = rows[0].db
	const role = readOnlyRoleName(db)
	const secret = appSecret(pool.options)
	const password = secret
		? createHmac('sha256', secret).update(role).digest('hex')
		: randomBytes(32).toString('hex')

	try {
		await pool.query(`CREATE ROLE ${quote(role)} LOGIN`)
	} catch (err: any) {
		if (err?.code !== DUPLICATE_OBJECT) throw err
	}
	// Only a superuser may set these attributes, so check them instead: a role
	// with the same name made by someone else must not become our reader.
	const attrs = await pool.query(
		`select rolsuper or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls as extra
		 from pg_roles where rolname = '${role}'`,
	)
	if (attrs.rows[0]?.extra) throw new Error(`role ${role} has more than read rights, refusing it`)
	await pool.query(`ALTER ROLE ${quote(role)} WITH LOGIN PASSWORD '${password}'`)
	await pool.query(`ALTER ROLE ${quote(role)} SET default_transaction_read_only = on`)
	await pool.query(`ALTER ROLE ${quote(role)} SET statement_timeout = '30s'`)
	await pool.query(`GRANT CONNECT ON DATABASE ${quote(db)} TO ${quote(role)}`)

	const schemas = await pool.query(
		`select nspname from pg_namespace
		 where nspname !~ '^pg_' and nspname <> 'information_schema'
		   and has_schema_privilege(nspname, 'USAGE')`,
	)
	for (const { nspname } of schemas.rows) {
		const s = quote(nspname)
		await pool.query(`GRANT USAGE ON SCHEMA ${s} TO ${quote(role)}`)
		await pool.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${s} TO ${quote(role)}`)
		// Tables the app creates later (remult ensureSchema, migrations).
		await pool.query(
			`ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT SELECT ON TABLES TO ${quote(role)}`,
		)
	}

	const Pool = (pool as any).constructor
	return new Pool(withCredentials(pool.options, role, password))
}
