import { Allow, Entity, Fields } from 'remult'

export const Roles_Evlog = {
	Evlog_Admin: 'Evlog.Admin',
}

@Entity<EvlogAudit>('_ff_evlog_audit', {
	caption: 'FF Evlog Audit',
	allowApiRead: Allow.everyone,
	allowApiInsert: Roles_Evlog.Evlog_Admin,
	allowApiUpdate: false,
	allowApiDelete: Roles_Evlog.Evlog_Admin,
	defaultOrderBy: { timestamp: 'desc' },
	changeLog: false,
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
	allowApiRead: Allow.everyone,
	allowApiInsert: Roles_Evlog.Evlog_Admin,
	allowApiUpdate: false,
	allowApiDelete: Roles_Evlog.Evlog_Admin,
	defaultOrderBy: { timestamp: 'desc' },
	changeLog: false,
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

export const evlogEntities = {
	EvlogAudit,
	EvlogTrace,
}
