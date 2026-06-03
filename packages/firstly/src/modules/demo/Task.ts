import { Entity, Fields } from 'remult'

// Demo entity for the ff() playground route (/ff-repo). Lives under src/modules
// so it ships with the dev app only - never part of the published package (`files: ["dist"]`).
@Entity('demo_tasks', { allowApiCrud: true, defaultOrderBy: { createdAt: 'desc' } })
export class Task {
	@Fields.id()
	id = ''

	@Fields.string({ caption: 'Task title', required: true })
	title = ''

	@Fields.createdAt()
	createdAt = new Date()
}
