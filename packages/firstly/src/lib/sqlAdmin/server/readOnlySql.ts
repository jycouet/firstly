import type { SqlResult, SqlTokenPool } from '../SqlAdminController'

/**
 * READ ONLY is only as strong as "one statement": over the simple protocol a
 * caller can send `commit; insert ...` and the second statement runs
 * autocommitted, outside the read-only transaction. The extended protocol
 * (`queryMode: 'extended'`) makes Postgres itself reject multi-statement
 * strings, so the transaction the client started is the one the query runs in.
 *
 * The client goes back to the pool with DISCARD ALL: session state a SELECT can
 * still leave behind (advisory locks, set_config) must not leak to the app.
 * A connection the query killed (pg_terminate_backend) is destroyed, not
 * returned, and its error is swallowed here rather than crashing the process.
 */
export async function readOnlySql(pool: SqlTokenPool, cmd: string): Promise<SqlResult> {
	const client = await pool.connect()
	let died: Error | undefined
	const onError = (err: Error) => {
		died = err
	}
	client.on('error', onError)
	const start = performance.now()
	try {
		await client.query('BEGIN READ ONLY')
		const res = await client.query({ text: cmd, values: [], queryMode: 'extended' })
		const rows = res.rows ?? []
		return { rows, rowCount: rows.length, took: performance.now() - start }
	} finally {
		if (!died) {
			await client.query('ROLLBACK').catch(() => {})
			await client.query('DISCARD ALL').catch(() => {})
		}
		client.off('error', onError)
		client.release(died)
	}
}
