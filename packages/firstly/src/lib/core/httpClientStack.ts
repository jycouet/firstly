export type HttpClientFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type HttpClientMiddleware = (next: HttpClientFetch) => HttpClientFetch

/**
 * Compose `fetch` middlewares into a single `fetch`-shaped function. Middlewares
 * run outermost-first (the first argument wraps the rest). Useful to inject auth
 * headers, correlation ids, retries, logging, ... around a base `fetch`.
 *
 * ```ts
 * const client = stackHttpClient(
 *   withHeader('x-correlation-id', () => crypto.randomUUID()),
 *   withHeader('authorization', () => `Bearer ${token}`),
 * )
 * await client('/api/...')
 * ```
 */
export function stackHttpClient(...middlewares: HttpClientMiddleware[]): HttpClientFetch {
	return middlewares.reduceRight<HttpClientFetch>(
		(next, mw) => mw(next),
		(input, init) => fetch(input, init),
	)
}

/** Middleware that sets a request header from `getValue()` when it returns a value. */
export function withHeader(
	name: string,
	getValue: () => string | undefined | null,
): HttpClientMiddleware {
	return (next) => async (input, init) => {
		const headers = new Headers(init?.headers)
		const value = getValue()
		if (value) headers.set(name, value)
		return next(input, { ...init, headers })
	}
}
