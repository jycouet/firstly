import { Entity, Fields } from 'remult'

export const Roles_ChangeLog = {
	ChangeLog_Admin: 'ChangeLog.Admin',
}

export interface change {
	key: string
	oldValue: string
	newValue: string
}

@Entity<ChangeLog>('_ff_change_logs', {
	caption: 'FF Change Logs',
	allowApiCrud: Roles_ChangeLog.ChangeLog_Admin,
	defaultOrderBy: {
		changeDate: 'desc',
	},
})
export class ChangeLog {
	@Fields.cuid()
	id = ''

	@Fields.string()
	entity: string = ''

	@Fields.string()
	entityId: string = ''

	@Fields.date()
	changeDate: Date = new Date()

	@Fields.string()
	userId = ''

	@Fields.json({ dbName: 'changesJson' })
	changes: change[] = []

	@Fields.boolean()
	newRow = false

	@Fields.boolean()
	deleted = false
}

export const changeLogEntities = {
	ChangeLog,
}
