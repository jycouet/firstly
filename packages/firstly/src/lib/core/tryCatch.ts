/**
 * A successful result returned by `tryCatch` or `tryCatchSync`.
 *
 * @template T - The type of the resolved value.
 */
type Success<T> = {
	data: T
	error: null
}

/**
 * A failure result returned by `tryCatch` or `tryCatchSync`.
 *
 * @template E - The type of the thrown error.
 */
type Failure<E> = {
	data: null
	error: E
}

/**
 * A result wrapper that contains either a success value or an error.
 *
 * @template T - The type of the success value.
 * @template E - The type of the error value.
 */
type Result<T, E = Error> = Success<T> | Failure<E>

/**
 * Wraps an async promise and returns a `Result` object instead of throwing.
 *
 * @template T - The type of the resolved value.
 * @template E - The type of the rejected error.
 * @param promise - The promise to execute.
 * @returns A result object with either `data` or `error`.
 */
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
	try {
		const data = await promise
		return { data, error: null }
	} catch (error) {
		return { data: null, error: error as E }
	}
}

/**
 * Wraps a synchronous function call and returns a `Result` object instead of throwing.
 *
 * @template T - The type of the returned value.
 * @template E - The type of the thrown error.
 * @param func - The synchronous function to execute.
 * @returns A result object with either `data` or `error`.
 */
export function tryCatchSync<T, E = Error>(func: () => T): Result<T, E> {
	try {
		const data = func()
		return { data, error: null }
	} catch (error) {
		return { data: null, error: error as E }
	}
}
