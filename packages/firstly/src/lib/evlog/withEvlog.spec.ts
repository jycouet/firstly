import { describe, expect, it, vi } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { withEvlog } from './withEvlog.js'

// Capture audit() calls by stubbing evlog::createLogger
// (recordAudit uses createLogger, not useLogger).

const audits: any[] = []
let throwOnEmit = false

vi.mock('evlog', async (orig) => {
	const mod = await orig<typeof import('evlog')>()
	return {
		...mod,

		createLogger: (init: any) => ({
			emit: () => {
				if (throwOnEmit) throw new Error('audit emit boom')
				if (init.audit) audits.push(init.audit)
			},
		}),
	}
})

@Entity('test_users', withEvlog({ allowApiCrud: true, evlog: { module: 'users' } }))
class User {
	@Fields.id()
	id = ''
	@Fields.string()
	name = ''
	@Fields.string()
	email = ''
}

@Entity<UserSecret>(
	'test_users_excluded',
	withEvlog<UserSecret>({
		allowApiCrud: true,
		evlog: {
			module: 'users',
			excludeColumns: (f) => [f.password],
			excludeValues: (f) => [f.email],
		},
	}),
)
class UserSecret {
	@Fields.id()
	id = ''
	@Fields.string()
	name = ''
	@Fields.string()
	email = ''
	@Fields.string()
	password = ''
}

@Entity('test_optout', withEvlog({ allowApiCrud: true, evlog: false }))
class OptOut {
	@Fields.id()
	id = ''
	@Fields.string()
	name = ''
}

async function withInMem<T>(fn: () => Promise<T>): Promise<T> {
	const dp: DataProvider = new InMemoryDataProvider()
	return withRemult(fn, { dataProvider: dp })
}

describe('withEvlog', () => {
	it('emits an audit on insert', async () => {
		audits.length = 0
		await withInMem(async () => {
			await remult.repo(User).insert({ id: 'u1', name: 'Alice', email: 'a@x' })
		})
		expect(audits).toHaveLength(1)
		expect(audits[0].action).toBe('test_users.create')

		expect(audits[0].changes.patch).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ op: 'add', path: '/id', value: 'u1' }),
				expect.objectContaining({ op: 'add', path: '/name', value: 'Alice' }),
			]),
		)
	})

	it('emits an audit on update with op:replace', async () => {
		audits.length = 0
		await withInMem(async () => {
			const r = remult.repo(User)
			await r.insert({ id: 'u2', name: 'Bob', email: 'b@x' })
			audits.length = 0
			const row = await r.findId('u2')
			await r.save({ ...row, name: 'Bobby' } as User)
		})
		expect(audits).toHaveLength(1)
		expect(audits[0].action).toBe('test_users.update')
		expect(audits[0].changes.patch).toEqual([
			expect.objectContaining({ op: 'replace', path: '/name', from: 'Bob', value: 'Bobby' }),
		])
	})

	it('emits an audit on delete with op:remove', async () => {
		audits.length = 0
		await withInMem(async () => {
			const r = remult.repo(User)
			await r.insert({ id: 'u3', name: 'Carol', email: 'c@x' })
			audits.length = 0
			await r.delete('u3')
		})
		expect(audits).toHaveLength(1)
		expect(audits[0].action).toBe('test_users.delete')
		expect(audits[0].changes.patch[0].op).toBe('remove')
	})

	it('excludeColumns omits the column entirely', async () => {
		audits.length = 0
		await withInMem(async () => {
			await remult.repo(UserSecret).insert({
				id: 'us1',
				name: 'X',
				email: 'x@x',
				password: 'secret123',
			})
		})

		const paths = audits[0].changes.patch.map((p: any) => p.path)
		expect(paths).not.toContain('/password')
		expect(paths).toContain('/email')
	})

	it('excludeValues redacts to [REDACTED] but keeps the path', async () => {
		audits.length = 0
		await withInMem(async () => {
			await remult.repo(UserSecret).insert({
				id: 'us2',
				name: 'Y',
				email: 'y@x',
				password: 'hidden',
			})
		})

		const emailEntry = audits[0].changes.patch.find((p: any) => p.path === '/email')
		expect(emailEntry?.value).toBe('[REDACTED]')
	})

	it('evlog: false produces no audit at all', async () => {
		audits.length = 0
		await withInMem(async () => {
			await remult.repo(OptOut).insert({ id: 'o1', name: 'silent' })
		})
		expect(audits).toHaveLength(0)
	})

	it('an audit-capture failure does not break the user write (best-effort)', async () => {
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		throwOnEmit = true
		try {
			await withInMem(async () => {
				const r = remult.repo(User)
				// The insert must resolve even though audit emit throws.
				await expect(r.insert({ id: 'u-fail', name: 'Dora', email: 'd@x' })).resolves.toBeTruthy()
				// ...and the row must actually be persisted.
				expect(await r.findId('u-fail')).toBeTruthy()
			})
			// The failure is logged best-effort (assert before mockRestore clears calls).
			expect(errSpy).toHaveBeenCalled()
		} finally {
			throwOnEmit = false
			errSpy.mockRestore()
		}
	})
})
