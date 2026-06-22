import { Entity, Fields } from 'remult'

export const Roles_Evlog = {
	Evlog_Admin: 'Evlog.Admin',
}

@Entity<EvlogAudit>('_ff_evlog_audit', {
	caption: 'FF Evlog Audit',
	allowApiRead: Roles_Evlog.Evlog_Admin,
	allowApiInsert: Roles_Evlog.Evlog_Admin,
	allowApiUpdate: false,
	allowApiDelete: Roles_Evlog.Evlog_Admin,
	defaultOrderBy: { timestamp: 'desc' },
	changeLog: false,
	hub: {
		strategy: 'paginate',
		pageSize: 15,
		cells: [
			{ col: 'timestamp', ui: { width: 14 } },
			{ col: 'module', ui: { width: 10 } },
			{ col: 'action', class: 'font-mono', ui: { width: 22 } },
			{ col: 'outcome', align: 'center', ui: { width: 10 } },
			{ col: 'actorType', ui: { width: 9 } },
			{ col: 'actorId', ui: { width: 11 } },
			{ col: 'targetType', ui: { width: 11 } },
			{ col: 'targetId', class: 'font-mono', ui: { width: 13 } },
		],
	},
})
export class EvlogAudit {
	@Fields.id()
	id = ''

	@Fields.date()
	timestamp: Date = new Date()

	@Fields.string({ allowNull: true })
	traceId?: string | null

	@Fields.string({ allowNull: true })
	correlationId?: string | null

	@Fields.string({ allowNull: true })
	module?: string | null

	@Fields.string()
	action: string = ''

	@Fields.string()
	outcome: 'success' | 'failure' | 'denied' = 'success'

	@Fields.string({ allowNull: true })
	reason?: string | null

	@Fields.string()
	actorType: 'user' | 'system' | 'api' | 'agent' = 'user'

	@Fields.string()
	actorId: string = ''

	@Fields.string({ allowNull: true })
	targetType?: string | null

	@Fields.string({ allowNull: true })
	targetId?: string | null

	@Fields.json({ allowNull: true })
	changes?: unknown

	@Fields.json({ allowNull: true })
	context?: Record<string, unknown> | null

	@Fields.json({ allowNull: true })
	raw?: unknown
}

@Entity<EvlogTrace>('_ff_evlog_trace', {
	caption: 'FF Evlog Trace',
	allowApiRead: Roles_Evlog.Evlog_Admin,
	allowApiInsert: Roles_Evlog.Evlog_Admin,
	allowApiUpdate: false,
	allowApiDelete: Roles_Evlog.Evlog_Admin,
	defaultOrderBy: { timestamp: 'desc' },
	changeLog: false,
	hub: {
		strategy: 'paginate',
		pageSize: 15,
		cells: [
			{ col: 'timestamp', ui: { width: 14 } },
			{
				col: 'source',
				align: 'center',
				ui: { width: 8 },
				component: () => import('./stats/cells/Source.svelte'),
				rowToProps: (r) => ({ value: r.source }),
			},
			{ col: 'method', ui: { width: 8 } },
			{ col: 'path', class: 'font-mono', ui: { width: 30 } },
			{
				col: 'status',
				align: 'right',
				ui: { width: 8 },
				component: () => import('./stats/cells/Status.svelte'),
				rowToProps: (r) => ({ value: r.status }),
			},
			{
				col: 'duration',
				align: 'right',
				ui: { width: 10 },
				component: () => import('./stats/cells/Ms.svelte'),
				rowToProps: (r) => ({ value: r.duration }),
			},
			{ col: 'module', ui: { width: 10 } },
			{ col: 'actorId', ui: { width: 12 } },
		],
	},
})
export class EvlogTrace {
	@Fields.id()
	id = ''

	@Fields.date()
	timestamp: Date = new Date()

	@Fields.string()
	level: 'info' | 'warn' | 'error' | 'debug' = 'info'

	@Fields.string()
	source: 'server' | 'client' = 'server'

	@Fields.string({ allowNull: true })
	service?: string | null

	@Fields.string({ allowNull: true })
	environment?: string | null

	@Fields.string({ allowNull: true })
	traceId?: string | null

	@Fields.string({ allowNull: true })
	requestId?: string | null

	@Fields.string({ allowNull: true })
	parentRequestId?: string | null

	@Fields.string({ allowNull: true })
	method?: string | null

	@Fields.string({ allowNull: true })
	path?: string | null

	@Fields.number({ allowNull: true })
	status?: number | null

	@Fields.number({ allowNull: true })
	duration?: number | null

	@Fields.string({ allowNull: true })
	operation?: string | null

	@Fields.string({ allowNull: true })
	module?: string | null

	@Fields.string({ allowNull: true })
	actorId?: string | null

	@Fields.json({ allowNull: true })
	event?: unknown
}

/**
 * One row per SQL query captured by `mountSqlSpans`. Split out from
 * `EvlogTrace.event.db_queries[]` so:
 * - the `event` JSON column on `_ff_evlog_trace` stays small,
 * - aggregate queries (slowest / hottest / most time) need no JSON path ops,
 * - retention can be tuned independently from the trace table.
 *
 * `traceId` references `EvlogTrace.id`. `path` is denormalized from the
 * parent trace so dashboards can group by triggering route without a join.
 */
@Entity<EvlogTraceQuery>('_ff_evlog_trace_query', {
	caption: 'FF Evlog Trace Query',
	allowApiRead: Roles_Evlog.Evlog_Admin,
	allowApiInsert: Roles_Evlog.Evlog_Admin,
	allowApiUpdate: false,
	allowApiDelete: Roles_Evlog.Evlog_Admin,
	defaultOrderBy: { timestamp: 'desc' },
	changeLog: false,
	hub: {
		strategy: 'paginate',
		pageSize: 20,
		cells: [
			{ col: 'timestamp', ui: { width: 14 } },
			{
				col: 'duration',
				align: 'right',
				ui: { width: 9 },
				component: () => import('./stats/cells/Ms.svelte'),
				rowToProps: (r) => ({ value: r.duration }),
			},
			{ col: 'path', class: 'font-mono', ui: { width: 25 } },
			{ col: 'sql', class: 'font-mono', ui: { width: 52 } },
		],
	},
})
export class EvlogTraceQuery {
	@Fields.id()
	id = ''

	@Fields.date()
	timestamp: Date = new Date()

	@Fields.string({ allowNull: true })
	traceId?: string | null

	@Fields.string({ allowNull: true })
	path?: string | null

	@Fields.string()
	sql: string = ''

	@Fields.number()
	duration: number = 0

	@Fields.json({ allowNull: true })
	args?: unknown
}

export const evlogEntities = {
	EvlogAudit,
	EvlogTrace,
	EvlogTraceQuery,
}
