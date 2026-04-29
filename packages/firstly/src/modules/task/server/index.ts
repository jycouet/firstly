import type { RequestEvent } from '@sveltejs/kit'
import { log } from 'evlog'
import { remult, repo } from 'remult'
import { Module } from 'remult/server'

import { EvlogAudit, EvlogTrace, EvlogTraceQuery, Roles_Evlog } from 'firstly/evlog'

import { Task } from '../Task.js'
import { TaskController } from '../TaskController.js'

const SEED = ['Buy milk', 'Walk the dog', 'Star firstly on GitHub']

export interface TaskModuleOptions {
	/**
	 * Wipe `Task` + the evlog tables and re-insert demo seed rows on every
	 * `initApi`. **Destructive** - opt-in only. Used by the firstly demo to
	 * keep `/tasks` deterministic. Production usage of this module template
	 * should leave it `false` (default).
	 */
	seed?: boolean
}

/**
 * Demo bootstrap: read `x-demo-user` header into `remult.user`, and
 * (when `seed: true`) wipe + reseed so the audit / trace tables are
 * predictable when you open `/tasks`.
 */
export const task = (options?: TaskModuleOptions) =>
	new Module<RequestEvent>({
		key: 'task',
		entities: [Task],
		controllers: [TaskController],

		initApi: async () => {
			if (!options?.seed) return
			// Demo-only seed path. Don't ship `seed: true` to prod - this wipes
			// the audit / trace tables along with Task rows.
			await repo(EvlogAudit)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(EvlogAudit).delete(r.id))))
			await repo(EvlogTrace)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(EvlogTrace).delete(r.id))))
			await repo(EvlogTraceQuery)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(EvlogTraceQuery).delete(r.id))))
			await repo(Task)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(Task).delete(r.id))))
			for (const title of SEED) await repo(Task).insert({ title })
			log.info('demo', `cleaned for the demo - seeded ${SEED.length} tasks`)
		},

		initRequest: async (event) => {
			// Demo-only auth: the page sends an `x-demo-user` header via
			// `stackHttpClient(withHeader(...))`. We use it to populate
			// `remult.user` so audit `actor.id` reflects the chosen identity
			// instead of `system`. Demo users get `Evlog_Admin` so the page can
			// read the admin-locked audit / trace tables; in real apps this
			// role should only go to operators.
			const demoUser = event.request.headers.get('x-demo-user')
			if (demoUser) {
				remult.user = {
					id: demoUser,
					name: demoUser,
					theme: 'light',
					roles: [Roles_Evlog.Evlog_Admin],
				}
			}
		},
	})
