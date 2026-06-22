import { Allow, BackendMethod, remult } from 'remult'

export type ClientNavInput = {
	routeId?: string | null
	pathname: string
	searchParams?: Array<[string, string]>
	referrer?: string
	/** Browser-provided timestamp (ms epoch) - preserves order across batched flushes. */
	at?: number
}

/**
 * Client-side navigation tracking. The browser collects SPA navigations and
 * flushes them in batches via `recordNavigations()` (typical cadence: 5s or
 * `pagehide`). Implemented as a `BackendMethod` rather than a public REST
 * insert so the server controls the event shape (no client can spoof
 * `status`, `actorId`, etc.). Events flow through the same drain pipeline
 * as request wide events - just tagged `source: 'client'`.
 */
/** Server-side cap. Keep aligned with `MAX_BATCH` in `clientTrace.ts`. */
const MAX_NAV_BATCH = 50
/** Drop events whose `at` is too far in the past or in the future. Guards against
 * a misbehaving client (clock skew or hostile spam) replaying old timestamps. */
const NAV_AGE_LIMIT_MS = 10 * 60 * 1000
// This is an `Allow.everyone` endpoint that force-keeps every row, so all
// client-controlled fields are bounded server-side to cap storage amplification
// and stop secrets riding in on query strings.
const MAX_PATHNAME = 2048
const MAX_ROUTE_ID = 512
const MAX_REFERRER = 2048
const MAX_SEARCH_PARAMS = 50
const MAX_PARAM_LEN = 256
const REDACTED = '[REDACTED]'
/** Query-string keys whose values are dropped (OAuth codes, tokens, secrets, PII). */
const SECRET_PARAM_KEY =
	/(?:^|[._-])(?:code|token|secret|password|pwd|key|auth|session|sig|signature|state|email|otp|jwt)(?:$|[._-])|^(?:code|state|key|sig|jwt|otp)$/i

function sanitizeSearchParams(raw: unknown): Array<[string, string]> {
	if (!Array.isArray(raw)) return []
	const out: Array<[string, string]> = []
	for (const pair of raw) {
		if (out.length >= MAX_SEARCH_PARAMS) break
		if (!Array.isArray(pair) || pair.length < 2) continue
		const key = String(pair[0]).slice(0, MAX_PARAM_LEN)
		const value = SECRET_PARAM_KEY.test(key) ? REDACTED : String(pair[1]).slice(0, MAX_PARAM_LEN)
		out.push([key, value])
	}
	return out
}

function capStr(value: unknown, max: number): string | null {
	return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : null
}

export class EvlogClientController {
	@BackendMethod({ allowed: Allow.everyone })
	static async recordNavigations(inputs: ClientNavInput[]): Promise<void> {
		if (!Array.isArray(inputs) || inputs.length === 0) return
		// Don't trust the client: cap the batch even though our own client
		// already chunks at MAX_BATCH.
		const trimmed = inputs.length > MAX_NAV_BATCH ? inputs.slice(0, MAX_NAV_BATCH) : inputs
		const { createLogger } = await import('evlog')
		const actorId = remult.user?.id ?? null
		const now = Date.now()
		for (const input of trimmed) {
			const at = typeof input.at === 'number' ? input.at : now
			// Reject obviously bogus timestamps so attackers can't pin spam to
			// arbitrary points in history.
			if (Math.abs(at - now) > NAV_AGE_LIMIT_MS) continue
			const pathname = typeof input.pathname === 'string' ? input.pathname.slice(0, MAX_PATHNAME) : ''
			if (!pathname) continue
			createLogger({
				timestamp: new Date(at).toISOString(),
				source: 'client',
				method: 'NAV',
				path: pathname,
				routeId: capStr(input.routeId, MAX_ROUTE_ID),
				searchParams: sanitizeSearchParams(input.searchParams),
				referrer: capStr(input.referrer, MAX_REFERRER),
				actorId,
			}).emit({ _forceKeep: true })
		}
	}

	/** @deprecated Use `recordNavigations([input])`. Kept for one release. */
	@BackendMethod({ allowed: Allow.everyone })
	static async recordNavigation(input: ClientNavInput): Promise<void> {
		return EvlogClientController.recordNavigations([input])
	}
}
