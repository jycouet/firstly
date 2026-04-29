import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Per-async-context flag set by drains while they write back to the database.
 * `SqlDatabase.LogToConsole` checks this and skips emitting spans for the
 * drain's own writes - prevents an infinite emit-write-emit loop without
 * relying on table-name string matching.
 */
const suppressStore = new AsyncLocalStorage<true>()

export function withSuppressedLogging<T>(fn: () => T): T {
	return suppressStore.run(true, fn)
}

export function isLoggingSuppressed(): boolean {
	return suppressStore.getStore() === true
}
