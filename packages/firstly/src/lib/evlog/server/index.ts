import type { Handle, RequestEvent } from '@sveltejs/kit'
import {
	initLogger,
	type DrainFn,
	type EnrichContext,
	type EvlogPlugin,
	type PluginSetupContext,
} from 'evlog'
import { evlog as evlogSvelteKitHandle } from 'evlog/sveltekit'
import {
	composeDrains,
	defineEvlog,
	toLoggerConfig,
	toMiddlewareOptions,
	type EvlogConfig,
} from 'evlog/toolkit'

import { remult } from 'remult'
import { Module } from 'remult/server'

import { EvlogClientController } from '../EvlogClientController.js'
import { EvlogAudit, EvlogTrace, EvlogTraceQuery } from '../evlogEntities.js'
import { EvlogStatsController } from '../EvlogStatsController.js'
import { captureDataProvider } from './dataProviderCapture.js'
import { EvlogPurgeController } from './EvlogPurgeController.js'
import { firstlyAuditPlugin } from './plugins/audit.js'
import { firstlyTracePlugin } from './plugins/trace.js'

// Re-exports
export { withSuppressedLogging, isLoggingSuppressed } from './suppress.js'
export { mountSqlSpans } from './sqlSpan.js'
export { EvlogPurgeController } from './EvlogPurgeController.js'
export { firstlyAuditPlugin } from './plugins/audit.js'
export { firstlyTracePlugin } from './plugins/trace.js'
export { defineEvlog, composePlugins, composeDrains } from 'evlog/toolkit'
export { purgeEvlog } from './remultDrains.js'

export interface EvlogModuleOptions {
	service?: string
	environment?: string
	audit?: { enabled?: boolean; entity?: typeof EvlogAudit; denied?: boolean }
	trace?: {
		enabled?: boolean
		entity?: typeof EvlogTrace
		queryEntity?: typeof EvlogTraceQuery
		skipPaths?: string[]
		retentionDays?: number
	}
	/** Additional drains to fan out alongside the firstly plugins. */
	drains?: DrainFn[]
	/** Additional toolkit plugins (Axiom, OTLP, custom). */
	plugins?: EvlogPlugin[]
	/** Capture SQL queries on the request wide event. @default true */
	sqlSpans?: boolean | { tablesToHide?: string[]; minDurationMs?: number }
	/** Enrichers (event mutators) wired into the SvelteKit handle. */
	enrich?: (ctx: EnrichContext) => void | Promise<void>
}

export interface FirstlyEvlog {
	/** Remult module: register in `remultApi({ modules: [ev.module, ...] })`. */
	module: Module<RequestEvent>
	/** SvelteKit handle: place BEFORE `handleRemult` in `sequence(...)`. */
	handle: Handle
	/** The toolkit config object. Useful for advanced composition. */
	config: EvlogConfig
}

/**
 * `firstly/evlog` setup. Returns a Remult Module + a SvelteKit Handle derived
 * from a single `evlog/toolkit` config object - no module-level state.
 *
 * @example
 * ```ts
 * // shared
 * const ev = evlog({ service: 'my-app' })
 *
 * // server/api.ts
 * export const api = remultApi({ modules: [ev.module, task()] })
 *
 * // hooks.server.ts
 * export const handle = sequence(ev.handle, handleRemult)
 * ```
 */
export const evlog = (options: EvlogModuleOptions = {}): FirstlyEvlog => {
	const auditEnabled = options.audit?.enabled !== false
	const traceEnabled = options.trace?.enabled !== false
	const retentionDays = options.trace?.retentionDays ?? 90
	const sqlSpans = options.sqlSpans

	const plugins: EvlogPlugin[] = []
	if (auditEnabled) {
		plugins.push(
			firstlyAuditPlugin({
				entity: options.audit?.entity,
				denied: options.audit?.denied,
			}),
		)
	}
	if (traceEnabled) {
		plugins.push(
			firstlyTracePlugin({
				entity: options.trace?.entity,
				queryEntity: options.trace?.queryEntity,
				skipPaths: options.trace?.skipPaths,
				retentionDays,
				sqlSpans,
			}),
		)
	}
	if (options.plugins?.length) plugins.push(...options.plugins)

	// `EvlogConfig.drain` is a single callback. Compose user-supplied fan-out
	// drains into one through the toolkit's `composeDrains` helper.
	const composedDrain =
		options.drains?.length === 1
			? options.drains[0]
			: options.drains?.length
				? composeDrains(options.drains, { name: 'firstly-user-drains' })
				: undefined

	const config = defineEvlog({
		service: options.service ?? 'firstly',
		environment: options.environment ?? process.env.NODE_ENV ?? 'development',
		plugins,
		drain: composedDrain,
		enrich: options.enrich,
	} as EvlogConfig)

	const module = new Module<RequestEvent>({
		key: 'evlog',
		entities: [
			...(auditEnabled ? [options.audit?.entity ?? EvlogAudit] : []),
			...(traceEnabled
				? [options.trace?.entity ?? EvlogTrace, options.trace?.queryEntity ?? EvlogTraceQuery]
				: []),
		],
		controllers: [EvlogClientController, EvlogStatsController, EvlogPurgeController],

		initApi: async () => {
			if (remult.dataProvider) captureDataProvider(remult.dataProvider)
			initLogger({ ...toLoggerConfig(config), _suppressDrainWarning: true })
			// Run each plugin's setup at boot (SQL span mounting, retention purge).
			// The toolkit's plugin runner inside the SvelteKit middleware also calls
			// setup, but we mirror it here so server-startup tasks happen before
			// the first request, not on it.
			for (const p of plugins) {
				try {
					await p.setup?.({} as PluginSetupContext)
				} catch (err) {
					console.error(`[evlog/${p.name}] setup failed:`, err)
				}
			}
		},

		initRequest: async () => {
			if (remult.dataProvider) captureDataProvider(remult.dataProvider)
			try {
				const { useLogger } = await import('evlog/sveltekit')
				const log = useLogger()
				log.set({ userId: remult.user?.id })
			} catch {
				// useLogger unavailable - silent skip
			}
		},
	})

	const handle = evlogSvelteKitHandle(toMiddlewareOptions(config)) as unknown as Handle

	return { module, handle, config }
}
