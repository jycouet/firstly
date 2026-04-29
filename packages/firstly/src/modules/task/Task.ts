import { Allow, Entity, Fields } from 'remult'

import { withEvlog } from '$lib/evlog'

@Entity<Task>(
	'tasks',
	withEvlog({
		caption: 'Tasks',
		allowApiCrud: Allow.everyone,
		defaultOrderBy: { createdAt: 'desc' },
		evlog: { module: 'demo-tasks' },
	}),
)
export class Task {
	@Fields.id()
	id = ''

	@Fields.string()
	title = ''

	@Fields.boolean()
	completed = false

	@Fields.createdAt()
	createdAt!: Date
}
