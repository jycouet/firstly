import { afterNavigate } from '$app/navigation'

import { EvlogClientController } from './EvlogClientController.js'

/**
 * Hook SvelteKit's `afterNavigate` to record every SPA navigation as a
 * `source: 'client'` trace event. Call once from your root `+layout.svelte`:
 *
 * ```svelte
 * <script lang="ts">
 *   import { initClientTrace } from 'firstly/evlog'
 *   initClientTrace()
 * </script>
 * ```
 *
 * Server-side initial loads are already captured by the SvelteKit handle
 * (`source: 'server'`), so the two together give you both navigation modes
 * in one table.
 */
export function initClientTrace() {
	afterNavigate(({ to, from }) => {
		if (!to) return
		EvlogClientController.recordNavigation({
			routeId: to.route?.id ?? null,
			pathname: to.url.pathname,
			searchParams: [...to.url.searchParams.entries()],
			referrer: from?.url.pathname,
		}).catch((err) => console.error('[firstly/evlog] client trace failed:', err))
	})
}
