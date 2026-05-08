import type { EvlogError } from 'evlog'
import { useLogger } from 'evlog/sveltekit'

/**
 * Set the active wide event's `error` fields then throw the error.
 *
 * Remult turns thrown errors into JSON responses, which means evlog's
 * SvelteKit handle never sees the throw - the trace event would otherwise
 * lack the structured error context. Call this inside BackendMethods
 * instead of `throw err` directly.
 *
 * @example
 * ```ts
 * import { createError, throwLogged } from 'firstly/evlog/server'
 *
 * throwLogged(createError({
 *   status: 403,
 *   message: 'cannot refund',
 *   why: '...',
 *   fix: '...',
 *   link: '...',
 * }))
 * ```
 */
export function throwLogged(err: EvlogError): never {
	const log = useLogger()
	log.error(err)
	log.set({
		error: { why: err.why, fix: err.fix, link: err.link, status: err.status },
	})
	throw err
}
