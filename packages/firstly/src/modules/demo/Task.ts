import { Entity, Fields, getEntityRef } from 'remult'

@Entity<Task>('demo_tasks', {
	allowApiCrud: true,
	defaultOrderBy: { createdAt: 'desc' },
	// `hub` = the SSoT grid/form config (read by FF_Grid as defaults; any prop overrides it).
	// Kept a plain, component-free object so this isomorphic entity stays server-clean.
	hub: {
		cells: ['title', 'priority', { col: 'done', sortable: false }],
		insert: { cells: ['title', 'priority'] }, // `done` not settable on create (mirrors allowApiUpdate)
		// `update` omitted → inherits the list cells (title, priority, done)
		delete: {},
	},
})
export class Task {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Task title', required: true, ui: { width: 60 } }) title = ''
	@Fields.number({ caption: 'Priority', ui: { width: 40, align: 'right' } }) priority = 0
	// Server-side security: `done` is settable only on an existing row (not on insert) — the hub's
	// `insert.cells` mirrors this in the UI.
	@Fields.boolean({ caption: 'Done', allowApiUpdate: (t) => !getEntityRef(t).isNew() }) done = false
	@Fields.createdAt() createdAt = new Date()
}
