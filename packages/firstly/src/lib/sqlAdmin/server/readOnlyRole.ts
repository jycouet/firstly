import { createHmac, randomBytes } from 'node:crypto'

import type { SqlTokenPool } from '../SqlAdminController'

const NON_IDENT = /[^a-z0-9_]/g
const MAX_IDENT = 63
const DUPLICATE_OBJECT = '42710'
const STATEMENT_TIMEOUT = '30s'

type PgPool = SqlTokenPool & {
	options: Record<string, any>
	query(sql: string, values?: unknown[]): Promise<{ rows: any[] }>
	end?(): Promise<void>
}

/** Schemas the app can grant on: it owns them, or is a member of their owner. */
const GRANTABLE_SCHEMA = `n.nspname !~ '^pg_' and n.nspname <> 'information_schema' and pg_has_role(n.nspowner, 'USAGE')`

/** One round trip: is the role still exactly what setup would leave behind? */
const STATE_SQL = `
select
  r.rolsuper or r.rolcreaterole or r.rolcreatedb or r.rolreplication or r.rolbypassrls as extra,
  coalesce(r.rolconfig @> array['default_transaction_read_only=on', 'statement_timeout=${STATEMENT_TIMEOUT}'], false)
  and not exists (
    select 1 from pg_namespace n
    where ${GRANTABLE_SCHEMA}
      and (not has_schema_privilege(r.oid, n.oid, 'USAGE')
        or not exists (
          select 1 from pg_default_acl d, aclexplode(d.defaclacl) a
          where d.defaclnamespace = n.oid and d.defaclobjtype = 'r'
            and d.defaclrole = (select oid from pg_roles where rolname = current_user)
            and a.grantee = r.oid and a.privilege_type = 'SELECT')))
  and not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where ${GRANTABLE_SCHEMA} and c.relkind in ('r', 'v', 'm', 'p', 'f')
      and pg_has_role(c.relowner, 'USAGE')
      and not has_table_privilege(r.oid, c.oid, 'SELECT')) as ready
from pg_roles r where r.rolname = $1`

const quote = (s: string) => `"${s.replaceAll('"', '""')}"`

export const readOnlyRoleName = (db: string) =>
	`ff_readonly_${db.toLowerCase().replace(NON_IDENT, '_')}`.slice(0, MAX_IDENT)

/** The app's own password: every instance derives the same role password, nothing to store. */
function appSecret(options: Record<string, any>): string | undefined {
	if (options.connectionString) {
		const url = new URL(options.connectionString)
		const pw = url.searchParams.get('password') || decodeURIComponent(url.password)
		if (pw) return pw
	}
	if (typeof options.password === 'string' && options.password) return options.password
	return process.env.PGPASSWORD || undefined
}

function withCredentials(options: Record<string, any>, user: string, password: string) {
	const { connectionString, ...rest } = options
	// pg lets the connection string win over `user`/`password`, so rewrite the URL itself.
	// Query params, not userinfo: a hostless URL (unix socket) silently drops userinfo, and pg reads params first.
	if (connectionString) {
		const url = new URL(connectionString)
		url.username = ''
		url.password = ''
		url.searchParams.set('user', user)
		url.searchParams.set('password', password)
		return { ...rest, connectionString: url.toString(), max: 2 }
	}
	return { ...rest, user, password, max: 2 }
}

/**
 * Returns a pool connected as a login role that can only SELECT in this
 * database. Per-database grants rather than `pg_read_all_data`: that one
 * reaches every database of the cluster. A boot where the role is already
 * right costs one login and one catalog query; anything off (new schema,
 * rotated app password, missing grant) re-runs the full setup. Needs
 * CREATEROLE on the app role.
 */
export async function ensureReadOnlyPool(
	app: SqlTokenPool,
): Promise<{ pool: SqlTokenPool; role: string; updated: boolean }> {
	const pool = app as PgPool
	if (typeof pool.query !== 'function' || !pool.options) throw new Error('not a pg pool')

	const { rows } = await pool.query('select current_database() as db')
	const db: string = rows[0].db
	const role = readOnlyRoleName(db)
	const secret = appSecret(pool.options)
	const password = secret
		? createHmac('sha256', secret).update(role).digest('hex')
		: randomBytes(32).toString('hex')
	const Pool = (pool as any).constructor
	const ro: PgPool = new Pool(withCredentials(pool.options, role, password))

	const state = await readState(pool, ro, role)
	// A role with the same name made by someone else must not become our reader.
	if (state?.extra) throw new Error(`role ${role} has more than read rights, refusing it`)
	if (state?.ready) return { pool: ro, role, updated: false }

	await setup(pool, db, role, password)
	// Handing back a pool that cannot log in would break every read instead of falling back.
	if (!(await connectsAs(ro, role))) {
		await ro.end?.().catch(() => {})
		throw new Error(`role ${role} was set up but cannot log in (pg_hba, pooler user naming?)`)
	}
	return { pool: ro, role, updated: true }
}

async function readState(app: PgPool, ro: PgPool, role: string) {
	const row = (await app.query(STATE_SQL, [role])).rows[0]
	if (!row) return undefined
	// Logging in proves the derived password still matches (the app's may have rotated).
	const loggedIn = !row.extra && (await connectsAs(ro, role))
	return { extra: row.extra as boolean, ready: loggedIn && row.ready === true }
}

/** As `role`, not merely connected: a dropped credential would log in as the app. */
const connectsAs = (ro: PgPool, role: string) =>
	ro.query('select current_user as u').then(
		(r) => r.rows[0]?.u === role,
		() => false,
	)

async function setup(pool: PgPool, db: string, role: string, password: string) {
	const r = quote(role)
	try {
		await pool.query(`CREATE ROLE ${r} LOGIN`)
	} catch (err: any) {
		if (err?.code !== DUPLICATE_OBJECT) throw err
	}
	// Only a superuser may set NOSUPERUSER & co, hence the `extra` check instead.
	await pool.query(`ALTER ROLE ${r} WITH LOGIN PASSWORD '${password}'`)
	await pool.query(`ALTER ROLE ${r} SET default_transaction_read_only = on`)
	await pool.query(`ALTER ROLE ${r} SET statement_timeout = '${STATEMENT_TIMEOUT}'`)
	await pool.query(`GRANT CONNECT ON DATABASE ${quote(db)} TO ${r}`)

	const schemas = await pool.query(`select n.nspname from pg_namespace n where ${GRANTABLE_SCHEMA}`)
	for (const { nspname } of schemas.rows) {
		const s = quote(nspname)
		await pool.query(`GRANT USAGE ON SCHEMA ${s} TO ${r}`)
		await pool.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${s} TO ${r}`)
		// Tables the app creates later (remult ensureSchema, migrations).
		await pool.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${s} GRANT SELECT ON TABLES TO ${r}`)
	}
}
