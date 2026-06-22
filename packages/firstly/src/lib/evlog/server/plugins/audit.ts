import type { DrainContext, EvlogPlugin } from 'evlog'
import { definePlugin } from 'evlog/toolkit'

import { remult } from 'remult'

import { EvlogAudit } from '../../evlogEntities.js'
import { inDetachedContext } from '../dataProviderCapture.js'
import { withSuppressedLogging } from '../suppress.js'

export interface FirstlyAuditPluginOptions {
	/** Override the storage entity (e.g. side-by-side migration to a v2 table). */
	entity?: typeof EvlogAudit
	/**
	 * Whether to emit a `denied` audit on 401/403 of `/api/*`.
	 * @default true
	 */
	denied?: boolean
}

/**
 * Firstly's audit plugin: persists `audit`-bearing wide events to a
 * Remult-backed entity, and (optionally) synthesizes a denied-audit row
 * for permission failures on `/api/*`.
 */
export function firstlyAuditPlugin(options: FirstlyAuditPluginOptions = {}): EvlogPlugin {
	const entity = options.entity ?? EvlogAudit
	const deniedEnabled = options.denied !== false

	return definePlugin({
		name: 'firstly-audit',

		drain: async (ctx: DrainContext) => {
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
				console.error('[firstly-audit] insert failed:', err)
			}
		},

		onRequestFinish: async (ctx) => {
			if (!deniedEnabled) return
			// status/path/method live on the always-present RequestFinishContext;
			// `ctx.event` is null when tail sampling drops the wide event, so reading
			// status off it would both crash (unhandled rejection) and miss the denial.
			const status = ctx.status
			if (status !== 401 && status !== 403) return
			const path = ctx.request?.path ?? ''
			if (!path.startsWith('/api/')) return
			if (path.startsWith('/api/_ff_evlog_')) return

			const segment = path.slice('/api/'.length).split('?')[0].split('/')[0]
			if (!segment) return
			const isMethod = !segment.startsWith('_')
			const action = isMethod ? `${segment}.invoke` : `${segment}.access`

			// userId / module are only known when the wide event survived sampling.
			const evt = (ctx.event ?? {}) as Record<string, unknown>
			const userId = evt.userId as string | undefined

			const { createLogger, buildAuditFields } = await import('evlog')
			const fields = buildAuditFields({
				action,
				actor: {
					type: userId ? 'user' : 'system',
					id: userId ?? 'anonymous',
				},
				target: { type: segment, id: '' },
				outcome: 'denied',
				reason: `HTTP ${status} on ${ctx.request?.method ?? 'GET'} ${path}`,
			})
			createLogger({ audit: fields, module: (evt.module as string) ?? null }).emit({
				_forceKeep: true,
			})
		},
	})
}
