import { Allow, BackendMethod, remult } from 'remult'

/**
 * Client-side navigation tracking. The browser calls
 * `EvlogClientController.recordNavigation(...)` from `afterNavigate` so SPA
 * navs (which never hit a SvelteKit endpoint) still produce a trace row.
 *
 * Implemented as a `BackendMethod` rather than a public REST insert so the
 * server controls the event shape (no client can spoof `status`, `actorId`,
 * etc.). The event flows through the same drain pipeline as request wide
 * events - just tagged `source: 'client'`.
 */
export class EvlogClientController {
	@BackendMethod({ allowed: Allow.everyone })
	static async recordNavigation(input: {
		routeId?: string | null
		pathname: string
		searchParams?: Array<[string, string]>
		referrer?: string
	}): Promise<void> {
		const { createLogger } = await import('evlog')
		createLogger({
			source: 'client',
			method: 'NAV',
			path: input.pathname,
			routeId: input.routeId ?? null,
			searchParams: input.searchParams ?? [],
			referrer: input.referrer ?? null,
			actorId: remult.user?.id ?? null,
		}).emit({ _forceKeep: true })
	}
}
