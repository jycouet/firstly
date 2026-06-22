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

/**
 * Inject the W3C `traceparent` header so server-side wide events can stitch
 * onto a client-originated trace. `getTraceId` returns the current 32-hex
 * trace id (typically the browser's current request id from `evlog/client`),
 * or `undefined` to skip.
 *
 * The header format is `00-<traceId>-<spanId>-01` (sampled). A fresh random
 * 16-hex span id is generated per call.
 */
export function withTraceparent(getTraceId: () => string | undefined | null): HttpClientMiddleware {
	return withHeader('traceparent', () => {
		const traceId = getTraceId()
		if (!traceId) return undefined
		const trace = traceId.replaceAll('-', '').padEnd(32, '0').slice(0, 32)
		const span = randomSpanId()
		return `00-${trace}-${span}-01`
	})
}

function randomSpanId(): string {
	const bytes = new Uint8Array(8)
	crypto.getRandomValues(bytes)
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
