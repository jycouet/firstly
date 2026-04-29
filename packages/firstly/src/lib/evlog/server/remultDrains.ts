import type { DrainContext, DrainFn } from 'evlog'
import { remult, withRemult } from 'remult'
import type { DataProvider } from 'remult'

import { EvlogAudit, EvlogTrace } from '../evlogEntities.js'

import { withSuppressedLogging } from './suppress.js'

/**
 * Captured at `evlog()` `initApi` so drains can run AFTER the request's
 * Remult async context has been torn down (the SvelteKit handle calls drains
 * post-`resolve()`, by which point `remult.dataProvider` is no longer
 * accessible from the current async scope).
 */
let capturedDataProvider: DataProvider | undefined

export function captureDataProvider(dp: DataProvider) {
	capturedDataProvider = dp
}

async function inDetachedContext<T>(fn: () => Promise<T>): Promise<T> {
	// Lazy capture: in dev, vite HMR can wipe `capturedDataProvider`. If we're
	// still inside a Remult request scope (audit drains often are), grab the
	// provider opportunistically before falling back.
	if (!capturedDataProvider) {
		try {
			if (remult.dataProvider) capturedDataProvider = remult.dataProvider
		} catch {
			// `remult.dataProvider` access throws when no async context exists
		}
	}
	if (!capturedDataProvider) {
		return fn()
	}
	return withRemult(fn, { dataProvider: capturedDataProvider }) as Promise<T>
}

/**
 * Drain that persists `audit`-bearing wide events into a Remult-backed entity
 * (default: `EvlogAudit` → `_ff_evlog_audit`). Pass a custom entity to use a
 * different table (e.g. for side-by-side migration in My Minion).
 *
 * Skips events without an `audit` field (those go to the trace drain).
 * All writes happen inside `withSuppressedLogging` so the SQL span hook
 * does not re-emit them in a loop.
 */
export function remultAuditDrain(entity: typeof EvlogAudit = EvlogAudit): DrainFn {
	return async (ctx: DrainContext) => {
		const a = ctx.event.audit
		if (!a) return
		const evt = ctx.event as Record<string, unknown>
		try {
			await inDetachedContext(() =>
				withSuppressedLogging(() =>
					remult.repo(entity).insert({
						timestamp: new Date(ctx.event.timestamp),
						traceId: a.context?.traceId ?? null,
						correlationId: a.correlationId ?? null,
						module: (evt.module as string) ?? null,
						action: a.action,
						outcome: a.outcome,
						reason: a.reason ?? null,
						actorType: a.actor.type,
						actorId: a.actor.id,
						targetType: a.target?.type ?? null,
						targetId: a.target?.id ? String(a.target.id) : null,
						changes: a.changes ?? null,
						context: a.context ?? null,
						raw: ctx.event,
					}),
				),
			)
		} catch (err) {
			console.error('[firstly/evlog] auditDrain insert failed:', err)
		}
	}
}

export interface RemultTraceDrainOptions {
	/** Drop rows older than this. Not yet implemented (TODO). */
	retentionDays?: number
	/**
	 * Skip persisting traces whose `path` matches one of these patterns. Useful
	 * for high-volume noise like `/api/_liveQueryKeepAlive` or health-checks.
	 * Patterns are exact-match by default; suffix `*` for prefix match.
	 *
	 * @default ['/api/_liveQueryKeepAlive', '/api/_ff_evlog_audit*', '/api/_ff_evlog_trace*']
	 */
	skipPaths?: string[]
}

const DEFAULT_SKIP_PATHS = [
	'/api/_liveQueryKeepAlive',
	'/api/_ff_evlog_audit*',
	'/api/_ff_evlog_trace*',
	'/api/recordNavigation', // self-call from EvlogClientController
]

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

/**
 * Drain that persists non-audit wide events (request stats, forks, ad-hoc
 * `log.info`) into a Remult-backed entity (default: `EvlogTrace` →
 * `_ff_evlog_trace`).
 *
 * TODO: add a TTL job that drops rows older than `retentionDays`.
 */
export function remultTraceDrain(
	entity: typeof EvlogTrace = EvlogTrace,
	options?: RemultTraceDrainOptions,
): DrainFn {
	const shouldSkip = compilePathSkip(options?.skipPaths ?? DEFAULT_SKIP_PATHS)
	return async (ctx: DrainContext) => {
		if (ctx.event.audit) return
		const evt = ctx.event as Record<string, unknown>
		const path = (evt.path as string) ?? ctx.request?.path
		if (shouldSkip(path)) return
		try {
			await inDetachedContext(() =>
				withSuppressedLogging(() =>
					remult.repo(entity).insert({
						timestamp: new Date(ctx.event.timestamp),
						level: ctx.event.level,
						source: ((evt.source as string) ?? 'server') as 'server' | 'client',
						service: ctx.event.service ?? null,
						environment: ctx.event.environment ?? null,
						traceId: (evt.traceId as string) ?? null,
						requestId: (evt.requestId as string) ?? null,
						parentRequestId: (evt._parentRequestId as string) ?? null,
						method: (evt.method as string) ?? ctx.request?.method ?? null,
						path: path ?? null,
						status: (evt.status as number) ?? null,
						duration: parseDuration(evt.duration),
						operation: (evt.operation as string) ?? null,
						module: (evt.module as string) ?? null,
						actorId: (evt.actorId as string) ?? (evt.userId as string) ?? null,
						event: ctx.event,
					}),
				),
			)
		} catch (err) {
			// Surface drain failures - the wrapping `runEnrichAndDrain` swallows
			// them at WARN level which is easy to miss in dev.
			console.error('[firstly/evlog] traceDrain insert failed:', err)
		}
	}
}

/** Convert evlog's `"3ms"` / `"1.2s"` duration formats into milliseconds. */
function parseDuration(raw: unknown): number | null {
	if (typeof raw === 'number') return raw
	if (typeof raw !== 'string') return null
	const m = raw.match(/^([\d.]+)\s*(ms|s|m)$/)
	if (!m) return Number(raw) || null
	const n = parseFloat(m[1])
	if (m[2] === 's') return n * 1000
	if (m[2] === 'm') return n * 60_000
	return n
}

/** Compose multiple drains into one fan-out (Promise.allSettled). */
export function fanout(...drains: DrainFn[]): DrainFn {
	return async (ctx) => {
		await Promise.allSettled(drains.map((d) => d(ctx)))
	}
}

