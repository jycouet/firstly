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
			const pathname = typeof input.pathname === 'string' ? input.pathname.slice(0, 2048) : ''
			if (!pathname) continue
			createLogger({
				timestamp: new Date(at).toISOString(),
				source: 'client',
				method: 'NAV',
				path: pathname,
				routeId: input.routeId ?? null,
				searchParams: input.searchParams ?? [],
				referrer: input.referrer ?? null,
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
