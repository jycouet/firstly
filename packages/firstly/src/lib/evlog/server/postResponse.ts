import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Per-request flag tracking whether the response has already been produced.
 *
 * evlog emits the request's wide event once the response is produced (around
 * SvelteKit's `resolve()` returning). Streaming responses - notably remult
 * liveQuery SSE connections - keep running SQL *after* that point, inside the
 * same async context. Those late queries can no longer attach to the sealed
 * wide event, so `SqlDatabase.LogToConsole` skips them instead of triggering
 * evlog's "log.set() called after the wide event was emitted" warning.
 *
 * Mutable `{ produced }` ref (not a plain boolean) so the snapshot captured by
 * a streaming body's async resources sees the flip from `false` to `true`.
 */
const responseStore = new AsyncLocalStorage<{ produced: boolean }>()

/** Run a request handler inside the response-tracking scope. */
export function runWithResponseTracking<T>(fn: () => T): T {
	return responseStore.run({ produced: false }, fn)
}

/** Mark that the response has been produced (the wide event is about to be emitted). */
export function markResponseProduced(): void {
	const state = responseStore.getStore()
	if (state) state.produced = true
}

/** True once the current request's response was produced (i.e. the wide event is sealed). */
export function isPostResponse(): boolean {
	return responseStore.getStore()?.produced === true
}
