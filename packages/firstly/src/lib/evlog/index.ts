/* Public, frontend-safe exports for `firstly/evlog`. */

export {
	Roles_Evlog,
	EvlogAudit,
	EvlogTrace,
	EvlogTraceQuery,
	evlogEntities,
} from './evlogEntities.js'

export { withEvlog } from './withEvlog.js'
export type { EvlogColumnDeciderArgs } from './withEvlog.js'

export { EvlogClientController } from './EvlogClientController.js'
export { EvlogStatsController } from './EvlogStatsController.js'
export type {
	EvlogStatsData,
	MonthlyTraceStat,
	MonthlyAuditStat,
	MonthlyModuleStat,
	TopPage,
	PageFlow,
	UserAgentStat,
	QueryStat,
	QueryStats,
} from './EvlogStatsController.js'

/** All-in-one orchestrator. Fetches once and renders every panel. */
export { default as EvlogStats } from './EvlogStats.svelte'

/**
 * Individual panels - each takes a `data` prop. Compose your own dashboard:
 *
 * ```svelte
 * <script>
 *   import { EvlogStatsController, EvlogStatsTotals, EvlogStatsQueriesSlowest } from 'firstly/evlog'
 *   let stats = $state(null)
 *   onMount(async () => stats = await EvlogStatsController.getStats(2026))
 * </script>
 * {#if stats}
 *   <EvlogStatsTotals data={stats.totals} year={stats.year} />
 *   <EvlogStatsQueriesSlowest data={stats.queries.slowest} />
 * {/if}
 * ```
 */
export { default as EvlogStatsHeader } from './stats/Header.svelte'
export { default as EvlogStatsTotals } from './stats/Totals.svelte'
export { default as EvlogStatsTraces } from './stats/Traces.svelte'
export { default as EvlogStatsCrud } from './stats/Crud.svelte'
export { default as EvlogStatsModules } from './stats/Modules.svelte'
export { default as EvlogStatsTopPages } from './stats/TopPages.svelte'
export { default as EvlogStatsPageFlows } from './stats/PageFlows.svelte'
export { default as EvlogStatsBrowsers } from './stats/Browsers.svelte'
export { default as EvlogStatsOsDevices } from './stats/OsDevices.svelte'
export { default as EvlogStatsQueriesSlowest } from './stats/QueriesSlowest.svelte'
export { default as EvlogStatsQueriesTopTime } from './stats/QueriesTopTime.svelte'
export { default as EvlogStatsQueriesHot } from './stats/QueriesHot.svelte'
export { initClientTrace } from './clientTrace.js'

/** Re-exported from `evlog` so consumers don't have to install it directly. */
export {
	createError,
	parseError,
	auditDiff,
	defineAuditAction,
	AuditDeniedError,
	AUDIT_SCHEMA_VERSION,
} from 'evlog'

export type {
	WideEvent,
	BaseWideEvent,
	AuditFields,
	AuditInput,
	AuditActor,
	AuditTarget,
	AuditPatchOp,
	AuditDiffOptions,
	DrainContext,
	DrainFn,
	ErrorOptions,
	LogLevel,
} from 'evlog'

declare module 'remult' {
	export interface EntityOptions<entityType> {
		evlog?:
			| false
			| import('./withEvlog.js').EvlogColumnDeciderArgs<entityType>
	}
}
