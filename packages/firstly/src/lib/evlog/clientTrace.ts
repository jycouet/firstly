import { afterNavigate } from '$app/navigation'

import { EvlogClientController, type ClientNavInput } from './EvlogClientController.js'

const FLUSH_INTERVAL_MS = 5_000
const MAX_BATCH = 50

const buffer: ClientNavInput[] = []
let mounted = false

/**
 * Flush queued navigations. On `pagehide`, prefer `navigator.sendBeacon`
 * because the page is being torn down and a regular fetch may be cancelled
 * mid-flight. Drops events on transport failure rather than retrying - a
 * lost client nav is operational noise, not a correctness issue.
 */
async function flush(useBeacon: boolean) {
	if (buffer.length === 0) return
	const batch = buffer.splice(0, MAX_BATCH)

	if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
		try {
			const ok = navigator.sendBeacon(
				'/api/recordNavigations',
				new Blob([JSON.stringify({ args: [batch] })], { type: 'application/json' }),
			)
			if (ok) return
		} catch {
			// fall through to fetch
		}
	}

	try {
		await EvlogClientController.recordNavigations(batch)
	} catch (err) {
		console.error('[firstly/evlog] client trace flush failed:', err)
	}
}

/**
 * Hook SvelteKit's `afterNavigate` to record SPA navigations as
 * `source: 'client'` trace events.
 *
 * Buffers events in the browser and flushes:
 * - every 5s while the tab is active,
 * - on `visibilitychange: hidden` / `pagehide` via `navigator.sendBeacon`
 *   so events fire reliably when the user closes or reloads the tab.
 *
 * Skips the initial mount (`from === null`) because the server-side handle
 * already emits a trace row for that load - we'd otherwise double-count.
 *
 * Call once from your root `+layout.svelte`:
 *
 * ```svelte
 * <script lang="ts">
 *   import { initClientTrace } from 'firstly/evlog'
 *   initClientTrace()
 * </script>
 * ```
 */
export function initClientTrace() {
	if (mounted) return
	mounted = true

	afterNavigate(({ to, from }) => {
		// Skip initial mount: the SvelteKit handle already emitted a server-side
		// trace for the page load. afterNavigate fires for that mount with
		// `from === null` - persisting it would double-count.
		if (!to || !from) return
		buffer.push({
			routeId: to.route?.id ?? null,
			pathname: to.url.pathname,
			searchParams: [...to.url.searchParams.entries()],
			referrer: from.url.pathname,
			at: Date.now(),
		})
	})

	if (typeof window === 'undefined') return

	setInterval(() => {
		void flush(false)
	}, FLUSH_INTERVAL_MS)

	const onHide = () => {
		void flush(true)
	}
	window.addEventListener('pagehide', onHide)
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') onHide()
	})
}
