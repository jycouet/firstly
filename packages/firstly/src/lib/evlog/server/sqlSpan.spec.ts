import { afterEach, describe, expect, it, vi } from 'vitest'

describe('mountSqlSpans', () => {
	afterEach(() => {
		vi.doUnmock('evlog/sveltekit')
		vi.resetModules()
	})

	it('records each query once even when mountSqlSpans is called twice (HMR / double evlog())', async () => {
		vi.resetModules()
		const sets: Array<Record<string, unknown>> = []
		vi.doMock('evlog/sveltekit', () => ({
			useLogger: () => ({ set: (v: Record<string, unknown>) => sets.push(v) }),
		}))

		// Fresh module graph so the module-level `mounted` flag starts false and
		// the test shares the same SqlDatabase class instance as sqlSpan.ts.
		const { SqlDatabase } = await import('remult')
		const { mountSqlSpans } = await import('./sqlSpan.js')
		SqlDatabase.LogToConsole = undefined as never

		mountSqlSpans({ minDurationMs: 0 })
		mountSqlSpans({ minDurationMs: 0 }) // second registration must not double-wrap

		await (
			SqlDatabase.LogToConsole as unknown as (d: number, q: string, a: unknown) => Promise<void>
		)(5, 'select * from foo where id = ?', { id: 1 })

		const dbQuerySets = sets.filter((s) => 'db_queries' in s)
		expect(dbQuerySets).toHaveLength(1)
	})
})
