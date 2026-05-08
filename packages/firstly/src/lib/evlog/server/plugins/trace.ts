import type { DrainContext, EvlogPlugin } from 'evlog'
import { definePlugin } from 'evlog/toolkit'

import { remult, withRemult } from 'remult'

import { EvlogTrace, EvlogTraceQuery, Roles_Evlog } from '../../evlogEntities.js'
import { captureDataProvider, inDetachedContext } from '../dataProviderCapture.js'
import { EvlogPurgeController } from '../EvlogPurgeController.js'
import { mountSqlSpans } from '../sqlSpan.js'
import { withSuppressedLogging } from '../suppress.js'

const DEFAULT_SKIP_PATHS = [
	'/api/_liveQueryKeepAlive',
	'/api/_ff_evlog_audit*',
	'/api/_ff_evlog_trace*',
	'/api/recordNavigation',
	'/api/recordNavigations',
	'/api/purgeOlderThan',
]

export interface FirstlyTracePluginOptions {
	entity?: typeof EvlogTrace
	queryEntity?: typeof EvlogTraceQuery
	skipPaths?: string[]
	/** @default 90 */
	retentionDays?: number
	/** Mount SQL span capture. `true` = defaults; object = config. @default true */
	sqlSpans?: boolean | { tablesToHide?: string[]; minDurationMs?: number }
}

function compilePathSkip(patterns: string[]): (path: string | null | undefined) => boolean {
	const exact = new Set<string>()
	const prefixes: string[] = []
	for (const p of patterns) {
		if (p.endsWith('*')) prefixes.push(p.slice(0, -1))
		else exact.add(p)
	}
	return (path) => {
		if (!path) return false
		if (exact.has(path)) return true
		for (const p of prefixes) if (path.startsWith(p)) return true
		return false
	}
}

const DURATION_RE = /^([\d.]+)\s*(ms|s|m)$/
function parseDuration(raw: unknown): number | null {
	if (typeof raw === 'number') return raw
	if (typeof raw !== 'string') return null
	const m = DURATION_RE.exec(raw)
	if (!m) return Number(raw) || null
	const n = parseFloat(m[1])
	if (m[2] === 's') return n * 1000
	if (m[2] === 'm') return n * 60_000
	return n
}

export function firstlyTracePlugin(options: FirstlyTracePluginOptions = {}): EvlogPlugin {
	const entity = options.entity ?? EvlogTrace
	const queryEntity = options.queryEntity ?? EvlogTraceQuery
	const retentionDays = options.retentionDays ?? 90
	const sqlSpansOpt = options.sqlSpans
	const shouldSkip = compilePathSkip(options.skipPaths ?? DEFAULT_SKIP_PATHS)

	return definePlugin({
		name: 'firstly-trace',

		setup: async () => {
			if (sqlSpansOpt !== false) {
				try {
					mountSqlSpans(typeof sqlSpansOpt === 'object' ? sqlSpansOpt : undefined)
				} catch (err) {
					console.error('[firstly-trace] mountSqlSpans failed:', err)
				}
			}

			withRemult(async () => {
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
							`[firstly-trace] purged ${traces} traces + ${queries} queries older than ${retentionDays}d`,
						)
					}
				})
				.catch((err) => console.error('[firstly-trace] purge failed:', err))

			try {
				if (remult.dataProvider) captureDataProvider(remult.dataProvider)
			} catch {
				// no async context yet; per-request initApi will capture it
			}
		},

		drain: async (ctx: DrainContext) => {
			if (ctx.event.audit) return
			const evt = ctx.event as Record<string, unknown>
			const path = (evt.path as string) ?? null
			if (shouldSkip(path)) return

			const dbQueries = evt.db_queries as
				| Array<{ sql?: string; duration?: number; args?: unknown }>
				| undefined
			const eventForStorage: Record<string, unknown> = { ...evt }
			delete eventForStorage.db_queries
			const timestamp = new Date(ctx.event.timestamp)

			try {
				await inDetachedContext(() =>
					withSuppressedLogging(async () => {
						const trace = await remult.repo(entity).insert({
							timestamp,
							level: ctx.event.level,
							source: ((evt.source as string) ?? 'server') as 'server' | 'client',
							service: ctx.event.service ?? null,
							environment: ctx.event.environment ?? null,
							traceId: (evt.traceId as string) ?? null,
							requestId: (evt.requestId as string) ?? null,
							parentRequestId: (evt._parentRequestId as string) ?? null,
							method: (evt.method as string) ?? null,
							path: path ?? null,
							status: (evt.status as number) ?? null,
							duration: parseDuration(evt.duration),
							operation: (evt.operation as string) ?? null,
							module: (evt.module as string) ?? null,
							actorId: (evt.actorId as string) ?? (evt.userId as string) ?? null,
							event: eventForStorage,
						})
						if (dbQueries?.length) {
							await remult.repo(queryEntity).insert(
								dbQueries
									.filter((q) => typeof q.sql === 'string' && q.sql.length > 0)
									.map((q) => ({
										timestamp,
										traceId: trace.id,
										path: path ?? null,
										sql: q.sql as string,
										duration: typeof q.duration === 'number' ? q.duration : 0,
										args: q.args ?? null,
									})),
							)
						}
					}),
				)
			} catch (err) {
				console.error('[firstly-trace] insert failed:', err)
			}
		},
	})
}
