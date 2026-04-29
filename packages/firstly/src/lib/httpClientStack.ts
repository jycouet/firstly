/**
 * Composable `fetch` middleware stack.
 *
 * Drop-in replacement for `remult.apiClient.httpClient`. Each middleware is a
 * higher-order function `(next) => fetch`; they wrap right-to-left so the
 * first middleware in the list sees the request first and the response last.
 *
 * @example
 * ```ts
 * import { stackHttpClient, withHeader, withTraceparent } from 'firstly'
 *
 * remult.apiClient.httpClient = stackHttpClient(
 *   withTraceparent(),
 *   withHeader('X-Tenant-Id', () => currentTenant.id),
 * )
 * ```
 */
export type HttpClientFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export type HttpClientMiddleware = (next: HttpClientFetch) => HttpClientFetch

export function stackHttpClient(...middlewares: HttpClientMiddleware[]): HttpClientFetch {
	return middlewares.reduceRight<HttpClientFetch>(
		(next, mw) => mw(next),
		(input, init) => fetch(input, init),
	)
}

/**
 * Adds (or overwrites) a single request header. Header value is lazy: the
 * `getValue` callback is invoked per request, so it can return a fresh value
 * each time (e.g. a per-navigation correlation id). Returning `undefined` /
 * `null` skips the header.
 */
export function withHeader(name: string, getValue: () => string | undefined | null): HttpClientMiddleware {
	return (next) => (input, init) => {
		const value = getValue()
		if (value === undefined || value === null) return next(input, init)
		const headers = new Headers(init?.headers)
		headers.set(name, value)
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
