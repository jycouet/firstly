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

export type ShortTermCacheOptions = {
	/** How long a response is served from cache (default 2000ms). */
	ttlMs?: number
	/**
	 * Decide per request if it is cacheable. Default: GET requests, plus remult's
	 * read-only POSTs (`__action=get` / `__action=groupBy`, used when a filter is too
	 * long for a query string).
	 */
	shouldCache?: (
		input: RequestInfo | URL,
		init: RequestInit | undefined,
		cacheKey: string,
	) => boolean
}

const defaultShouldCache: NonNullable<ShortTermCacheOptions['shouldCache']> = (
	_input,
	init,
	key,
) => {
	const method = init?.method?.toUpperCase() ?? 'GET'
	if (method === 'GET') return true
	if (method === 'POST') return key.includes('__action=get') || key.includes('__action=groupBy')
	return false
}

/**
 * Middleware that dedupes identical read requests within a short TTL - a tiny
 * client-side cache. Two components mounting and issuing the same query result in
 * ONE network call; each caller gets its own `Response` clone. Failed requests are
 * evicted immediately so the next call retries.
 *
 * ```ts
 * remult.apiClient.httpClient = stackHttpClient(withShortTermCache({ ttlMs: 2000 }))
 * ```
 */
export function withShortTermCache(opts: ShortTermCacheOptions = {}): HttpClientMiddleware {
	const ttlMs = opts.ttlMs ?? 2000
	const shouldCache = opts.shouldCache ?? defaultShouldCache
	const cache = new Map<string, { promise: Promise<Response>; timestamp: number }>()

	return (next) => async (input, init) => {
		let cacheKey = input.toString()
		if (init?.body) {
			const body = init.body
			const bodyStr =
				typeof body === 'string'
					? body
					: body instanceof URLSearchParams
						? body.toString()
						: JSON.stringify(body)
			cacheKey = `${cacheKey}:${bodyStr}`
		}

		if (!shouldCache(input, init, cacheKey)) {
			return next(input, init)
		}

		const now = Date.now()
		const cached = cache.get(cacheKey)
		if (cached) {
			if (now - cached.timestamp < ttlMs) {
				const response = await cached.promise
				return response.clone()
			}
			cache.delete(cacheKey)
		}

		// Keep a pristine copy in cache; every consumer (incl. this one) reads a clone.
		const promise = next(input, init).then((r) => r.clone())
		cache.set(cacheKey, { promise, timestamp: now })

		try {
			const response = await promise
			return response.clone()
		} catch (e) {
			cache.delete(cacheKey)
			throw e
		}
	}
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
