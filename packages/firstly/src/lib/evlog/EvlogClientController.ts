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
export class EvlogClientController {
	@BackendMethod({ allowed: Allow.everyone })
	static async recordNavigations(inputs: ClientNavInput[]): Promise<void> {
		if (!inputs?.length) return
		const { createLogger } = await import('evlog')
		const actorId = remult.user?.id ?? null
		for (const input of inputs) {
			const ts = typeof input.at === 'number' ? new Date(input.at) : new Date()
			createLogger({
				timestamp: ts.toISOString(),
				source: 'client',
				method: 'NAV',
				path: input.pathname,
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
