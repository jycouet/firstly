import { Allow, BackendMethod, repo } from 'remult'

import { createError } from 'firstly/evlog'

import { Task } from './Task.js'

export class TaskController {
	/**
	 * Demo error: throws a structured `createError` so the page can show
	 * `why`/`fix`/`link` to the user, and attaches the error to the request
	 * wide event so the trace row carries the structured fields.
	 *
	 * Remult turns thrown errors into a JSON response - evlog's SvelteKit
	 * handle then sees a successful response (4xx status), not a thrown error.
	 * That's why we attach explicitly via `useLogger().error()` before throwing.
	 */
	@BackendMethod({ allowed: Allow.everyone })
	static async simulateError(): Promise<never> {
		const err = createError({
			status: 500,
			message: 'Demo failure - intentional',
			why: 'The /tasks demo page invoked simulateError() to show how evlog captures structured errors.',
			fix: 'This is just a demo. Click any other action to continue.',
			link: 'https://www.evlog.dev/errors',
		})
		const { useLogger } = await import('evlog/sveltekit')
		try {
			const log = useLogger()
			log.error(err)
			// `logger.error(err)` only captures `name` / `message` / `stack`;
			// merge the structured fields explicitly so the trace row carries them.
			const e = err as unknown as Record<string, unknown>
			log.set({
				error: { why: e.why, fix: e.fix, link: e.link, status: e.status },
			})
		} catch {
			// outside SvelteKit handle scope - skip
		}
		throw err
	}

	/**
	 * Mark every task as completed in one shot.
	 * Each updated row fires its own `withEvlog` `saved` hook, which produces
	 * one `audit()` event per task - so the audit trail shows the bulk action
	 * as N individual `tasks.update` events sharing the same request `traceId`.
	 */
	@BackendMethod({ allowed: Allow.everyone })
	static async setAllCompleted(completed: boolean): Promise<number> {
		const tasks = await repo(Task).find({ where: { completed: !completed } })
		for (const t of tasks) {
			t.completed = completed
			await repo(Task).save(t)
		}
		return tasks.length
	}

	@BackendMethod({ allowed: Allow.everyone })
	static async deleteAll(): Promise<number> {
		const tasks = await repo(Task).find()
		for (const t of tasks) {
			await repo(Task).delete(t)
		}
		return tasks.length
	}
}
