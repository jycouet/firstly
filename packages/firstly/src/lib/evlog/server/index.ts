import type { Handle, RequestEvent } from '@sveltejs/kit'
import { initLogger } from 'evlog'
import type { DrainContext, DrainFn, EnrichContext } from 'evlog'
import { evlog as evlogSvelteKitHandle } from 'evlog/sveltekit'

import { remult } from 'remult'
import { Module } from 'remult/server'

import { EvlogClientController } from '../EvlogClientController.js'
import { EvlogAudit, EvlogTrace, EvlogTraceQuery, Roles_Evlog } from '../evlogEntities.js'
import { EvlogStatsController } from '../EvlogStatsController.js'
import { EvlogPurgeController } from './EvlogPurgeController.js'
import { captureDataProvider, fanout, remultAuditDrain, remultTraceDrain } from './remultDrains.js'
import { mountSqlSpans } from './sqlSpan.js'

export { withSuppressedLogging, isLoggingSuppressed } from './suppress.js'
export { remultAuditDrain, remultTraceDrain, fanout, purgeEvlog } from './remultDrains.js'
export { mountSqlSpans } from './sqlSpan.js'
export { EvlogPurgeController } from './EvlogPurgeController.js'

export interface EvlogModuleOptions {
	/** Service name attached to every wide event. */
	service?: string
	/** Environment label - falls back to `process.env.NODE_ENV` or `development`. */
	environment?: string
	/** Audit storage. Defaults to `{ enabled: true, entity: EvlogAudit }`. */
	audit?: { enabled?: boolean; entity?: typeof EvlogAudit }
	/**
	 * Trace storage. `skipPaths` filters noise (default skips
	 * `/api/_liveQueryKeepAlive` and the evlog tables themselves).
	 *
	 * `retentionDays` (default 90) is the cutoff used by both the boot-time
	 * purge and `EvlogPurgeController.purgeOlderThan()`. Audit rows are
	 * never purged.
	 */
	trace?: {
		enabled?: boolean
		entity?: typeof EvlogTrace
		queryEntity?: typeof EvlogTraceQuery
		skipPaths?: string[]
		retentionDays?: number
	}
	/** Additional drains to fan out alongside the Remult drains (Axiom, OTLP, ...). */
	drains?: DrainFn[]
	/** Capture SQL queries as `log.info('db.query', ...)` on the request wide event. */
	sqlSpans?: boolean | { tablesToHide?: string[]; minDurationMs?: number }
}

/**
 * Shared drain reference - populated by `evlog()` factory, consumed by
 * `evlogHandle()`. We keep it module-level so the user can wire the SvelteKit
 * handle in `hooks.server.ts` BEFORE the Remult module's `initApi` runs and
 * still have both endpoints route events through the same drain pipeline.
 */
let sharedDrain: DrainFn | undefined

/**
 * `firstly/evlog` - audit + tracing module.
 *
 * Registers the audit + trace entities, configures evlog's global logger,
 * and exposes a SvelteKit `Handle` (`evlogHandle`) that you add to your
 * `hooks.server.ts` so `useLogger()` resolves inside route handlers and
 * Remult lifecycle hooks.
 *
 * @example
 * ```ts
 * // server/api.ts
 * import { remultApi } from 'remult/remult-sveltekit'
 * import { evlog } from 'firstly/evlog/server'
 * import { task } from '$modules/task/server'
 *
 * export const api = remultApi({
 *   modules: [evlog({ service: 'demo' }), task()],
 * })
 *
 * // hooks.server.ts
 * import { sequence } from '@sveltejs/kit/hooks'
 * import { evlogHandle } from 'firstly/evlog/server'
 * import { api as handleRemult } from './server/api'
 *
 * export const handle = sequence(evlogHandle(), handleRemult)
 * ```
 */
export const evlog = (options?: EvlogModuleOptions) => {
	const auditEntity = options?.audit?.entity ?? EvlogAudit
	const traceEntity = options?.trace?.entity ?? EvlogTrace
	const queryEntity = options?.trace?.queryEntity ?? EvlogTraceQuery
	const auditEnabled = options?.audit?.enabled !== false
	const traceEnabled = options?.trace?.enabled !== false
	const retentionDays = options?.trace?.retentionDays ?? 90

	const drains: DrainFn[] = []
	if (auditEnabled) drains.push(remultAuditDrain(auditEntity))
	if (traceEnabled)
		drains.push(
			remultTraceDrain(traceEntity, {
				skipPaths: options?.trace?.skipPaths,
				retentionDays,
				queryEntity,
			}),
		)
	if (options?.drains?.length) drains.push(...options.drains)
	sharedDrain = drains.length > 1 ? fanout(...drains) : drains[0]

	return new Module<RequestEvent>({
		key: 'evlog',
		entities: [
			...(auditEnabled ? [auditEntity] : []),
			...(traceEnabled ? [traceEntity, queryEntity] : []),
		],
		controllers: [EvlogClientController, EvlogStatsController, EvlogPurgeController],

		initApi: async () => {
			// Capture the configured Remult data provider so drains can re-acquire
			// a context after the request has torn down (`withRemult` fallback).
			if (remult.dataProvider) captureDataProvider(remult.dataProvider)

			initLogger({
				env: {
					service: options?.service ?? 'firstly',
					environment: options?.environment ?? process.env.NODE_ENV ?? 'development',
				},
				drain: sharedDrain,
				_suppressDrainWarning: true,
			})

			if (options?.sqlSpans !== false) {
				mountSqlSpans(typeof options?.sqlSpans === 'object' ? options.sqlSpans : undefined)
			}

			// One-shot purge at boot. Goes through the BackendMethod (no HTTP
			// hop server-side) so the same code path runs at boot and when
			// admins click "purge" in a dashboard. We need an admin role on the
			// async context for the `allowed` check to pass - use `withRemult`
			// with a synthetic system user. Don't await: drain inserts during
			// the first request shouldn't queue behind a large delete.
			if (traceEnabled) {
				const { withRemult: wr } = await import('remult')
				wr(async () => {
					remult.user = {
						id: 'system',
						name: 'evlog-boot',
						theme: 'light',
						roles: [Roles_Evlog.Evlog_Admin],
					}
					return EvlogPurgeController.purgeOlderThan(retentionDays)
				})
					.then(({ traces, queries }) => {
						if (traces || queries) {
							console.info(
								`[firstly/evlog] purged ${traces} traces + ${queries} queries older than ${retentionDays}d`,
							)
						}
					})
					.catch((err) => console.error('[firstly/evlog] purge failed:', err))
			}
		},

		initRequest: async (event) => {
			// Re-capture every request: vite HMR reloads `remultDrains.ts` and
			// resets the module-level reference, so `initApi` capture alone is
			// fragile in dev. `initRequest` runs inside the Remult scope where
			// `remult.dataProvider` is reachable.
			if (remult.dataProvider) captureDataProvider(remult.dataProvider)

			// useLogger() works because evlogHandle() set up AsyncLocalStorage upstream
			// in the hooks sequence. Tag the request wide event with whatever the
			// module knows: user id, route id.
			try {
				const { useLogger } = await import('evlog/sveltekit')
				const log = useLogger()
				log.set({
					userId: remult.user?.id,
					routeId: event.route?.id ?? null,
				})
			} catch {
				// useLogger is unavailable (e.g. evlogHandle not wired) - silent skip
			}
		},
	})
}

/**
 * SvelteKit `Handle` that wires evlog's request-scoped logger
 * (AsyncLocalStorage). Sequence it BEFORE the Remult handle so Remult
 * lifecycle hooks (and `withEvlog`-decorated entities) can call
 * `useLogger()` / `audit()`.
 */
export const evlogHandle = (options?: {
	drain?: DrainFn
	/**
	 * Mutate the wide event before it hits the drain. Wire evlog's built-ins
	 * (`createUserAgentEnricher`, `createGeoEnricher`, ...) here. See the
	 * `firstly/evlog` README "Enrich events" section.
	 */
	enrich?: (ctx: EnrichContext) => void | Promise<void>
}): Handle => {
	// Resolve the drain at request time, not at module load: `evlog()` may be
	// constructed AFTER `evlogHandle()` is referenced (the handle is set up
	// in hooks.server.ts; the Module is instantiated at api.ts import time
	// which happens shortly after).
	const inner = evlogSvelteKitHandle({
		drain: async (ctx) => {
			if (options?.drain) await options.drain(ctx)
			if (sharedDrain) await sharedDrain(ctx)
			// Permission denials (401/403) on Remult API paths never reach
			// `withEvlog`'s lifecycle hooks - the API gate fires first. Emit a
			// `denied` audit row from the request wide event so audit dashboards
			// see attempted-but-blocked actions, not just successes.
			await emitDeniedAudit(ctx)
		},
		enrich: options?.enrich,
	})
	// evlog's SvelteKit types are intentionally framework-agnostic (Promise<Response>);
	// wrap once so they line up with SvelteKit's `Handle` (MaybePromise<Response>).
	return inner as unknown as Handle
}

/**
 * If the request resolved with 401/403 on an API path, synthesize a `denied`
 * audit event. The `action` is best-effort derived from the path
 * (`/api/<entity>` → `<entity>.access`, `/api/<methodName>` for backend
 * methods → `<methodName>.invoke`).
 */
async function emitDeniedAudit(ctx: DrainContext) {
	const evt = ctx.event as Record<string, unknown>
	const status = evt.status as number | undefined
	if (status !== 401 && status !== 403) return
	const path = (evt.path as string | undefined) ?? ''
	if (!path.startsWith('/api/')) return
	// Skip the evlog table reads themselves so a non-admin probe doesn't
	// flood the audit table.
	if (path.startsWith('/api/_ff_evlog_')) return

	const segment = path.slice('/api/'.length).split('?')[0].split('/')[0]
	if (!segment) return
	const isMethod = !segment.startsWith('_')
	const action = isMethod ? `${segment}.invoke` : `${segment}.access`

	const { createLogger } = await import('evlog')
	const { buildAuditFields } = await import('evlog')
	const fields = buildAuditFields({
		action,
		actor: {
			type: evt.userId ? 'user' : 'system',
			id: (evt.userId as string) ?? 'anonymous',
		},
		target: { type: segment, id: '' },
		outcome: 'denied',
		reason: `HTTP ${status} on ${(evt.method as string) ?? 'GET'} ${path}`,
	})
	createLogger({ audit: fields, module: (evt.module as string) ?? null }).emit({
		_forceKeep: true,
	})
}
