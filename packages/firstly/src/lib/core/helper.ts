import type { ErrorInfo } from 'remult'

export function isError<T>(object: any): object is ErrorInfo<T> {
	return object
}

/**
 * Extract a user-readable message from any thrown / rejected value.
 *
 * Why a helper instead of `String(err)`: when a remult `BackendMethod`
 * rejects, the client receives a plain object matching `ErrorInfo`
 * (`{ message?, modelState? }`) - **not** an `Error` instance. The naive
 * `err instanceof Error ? err.message : String(err)` fallback prints
 * `[object Object]` for those rejections and surfaces nothing useful.
 *
 * Order of resolution:
 * 1. plain string -> as-is
 * 2. native `Error` (incl. `EntityError`, `ForbiddenError`) -> `.message`
 * 3. `ErrorInfo`-shaped object with `.message` -> that message
 * 4. `ErrorInfo`-shaped object with `.modelState` -> first non-empty value
 * 5. fallback to `JSON.stringify(err)` (so the shape is at least readable)
 */
export function errorMessage(err: unknown, fallback = 'Unknown error'): string {
	if (err == null) return fallback
	if (typeof err === 'string') return err || fallback
	if (err instanceof Error && err.message) return err.message
	if (typeof err === 'object') {
		const e = err as { message?: unknown; modelState?: Record<string, unknown> }
		if (typeof e.message === 'string' && e.message) return e.message
		if (e.modelState && typeof e.modelState === 'object') {
			const first = Object.values(e.modelState).find((v) => typeof v === 'string' && v)
			if (typeof first === 'string') return first
		}
	}
	try {
		return JSON.stringify(err)
	} catch {
		return String(err)
	}
}
