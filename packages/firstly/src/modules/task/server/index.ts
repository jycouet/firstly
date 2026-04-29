import type { RequestEvent } from '@sveltejs/kit'
import { log } from 'evlog'
import { remult, repo } from 'remult'
import { Module } from 'remult/server'

import { EvlogAudit, EvlogTrace } from 'firstly/evlog'

import { Task } from '../Task.js'
import { TaskController } from '../TaskController.js'

const SEED = ['Buy milk', 'Walk the dog', 'Star firstly on GitHub']

/**
 * Demo bootstrap: read `x-demo-user` header into `remult.user`, and seed a
 * fresh dataset on every server start so the audit / trace tables are
 * predictable when you open `/tasks`.
 */
export const task = () =>
	new Module<RequestEvent>({
		key: 'task',
		entities: [Task],
		controllers: [TaskController],

		initApi: async () => {
			// Wipe + reseed so the demo starts from a known state.
			await repo(EvlogAudit)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(EvlogAudit).delete(r.id))))
			await repo(EvlogTrace)
				.find()
				.then((rows) => Promise.all(rows.map((r) => repo(EvlogTrace).delete(r.id))))
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
			// instead of `system`.
			const demoUser = event.request.headers.get('x-demo-user')
			if (demoUser) {
				remult.user = { id: demoUser, name: demoUser, theme: 'light' }
			}
		},
	})
