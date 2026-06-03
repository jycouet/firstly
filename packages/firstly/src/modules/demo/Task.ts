import { Entity, Fields } from 'remult'

@Entity('demo_tasks', { allowApiCrud: true, defaultOrderBy: { createdAt: 'desc' } })
export class Task {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Task title', required: true, ui: { width: 60 } }) title = ''
	@Fields.number({ caption: 'Priority', ui: { width: 40, align: 'right' } }) priority = 0
	@Fields.boolean({ caption: 'Done' }) done = false
	@Fields.createdAt() createdAt = new Date()
}
