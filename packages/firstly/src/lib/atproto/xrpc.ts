export class XrpcError extends Error {
	constructor(
		public status: number,
		public error: string,
		message?: string,
	) {
		super(message ?? error)
		this.name = 'XrpcError'
	}
}

export interface XrpcClient {
	query(nsid: string, params?: Record<string, unknown>): Promise<any>
	procedure(nsid: string, input?: unknown, params?: Record<string, unknown>): Promise<any>
}

export interface XrpcOptions {
	/** PDS origin, e.g. https://bsky.social */
	service: string
	/** Bearer token (access JWT). Omit for public reads. */
	auth?: () => Promise<string | undefined> | string | undefined
	fetch?: typeof fetch
	/** Per-call timeout (ms); a hung PDS must not hang the app. */
	timeoutMs?: number
}

const RE_TRAILING_SLASH = /\/$/

function qs(params?: Record<string, unknown>) {
	const sp = new URLSearchParams()
	for (const [k, v] of Object.entries(params ?? {})) {
		if (v === undefined || v === null) continue
		if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)))
		else sp.append(k, String(v))
	}
	const s = sp.toString()
	return s ? `?${s}` : ''
}

export function xrpcClient({
	service,
	auth,
	fetch: f = fetch,
	timeoutMs = 15_000,
}: XrpcOptions): XrpcClient {
	const base = service.replace(RE_TRAILING_SLASH, '')
	const call = async (
		method: 'GET' | 'POST',
		nsid: string,
		params?: Record<string, unknown>,
		input?: unknown,
	) => {
		const headers: Record<string, string> = {}
		const token = await auth?.()
		if (token) headers.authorization = `Bearer ${token}`
		if (input !== undefined) headers['content-type'] = 'application/json'
		const res = await f(`${base}/xrpc/${nsid}${qs(params)}`, {
			method,
			headers,
			body: input === undefined ? undefined : JSON.stringify(input),
			signal: AbortSignal.timeout(timeoutMs),
		})
		const text = await res.text()
		const json = text ? JSON.parse(text) : undefined
		if (!res.ok) throw new XrpcError(res.status, json?.error ?? 'Unknown', json?.message)
		return json
	}
	return {
		query: (nsid, params) => call('GET', nsid, params),
		procedure: (nsid, input, params) => call('POST', nsid, params, input),
	}
}
