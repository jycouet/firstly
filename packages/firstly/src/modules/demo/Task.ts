import { Entity, Fields, getEntityRef } from 'remult'

@Entity('demo_tasks', { allowApiCrud: true, defaultOrderBy: { createdAt: 'desc' } })
export class Task {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Task title', required: true, ui: { width: 60 } }) title = ''
	@Fields.number({ caption: 'Priority', ui: { width: 40, align: 'right' } }) priority = 0
	// Server-side security: `done` is settable only on an existing row (not on insert).
	// The boutique UI mirrors this by naming `done` in editFields but not createFields.
	@Fields.boolean({ caption: 'Done', allowApiUpdate: (t) => !getEntityRef(t).isNew() }) done = false
	@Fields.createdAt() createdAt = new Date()
}
