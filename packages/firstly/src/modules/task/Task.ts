import { Allow, Entity, Field, Fields, getEntityRef } from 'remult'

import { FF_Role } from '$lib'

import { TaskTypeEnum } from './TaskTypeEnum'

@Entity('task', {
	// allowApiCrud: Allow.authenticated,
	allowApiRead: true,
	allowApiInsert: Allow.authenticated,
	allowApiUpdate: Allow.authenticated,
	allowApiDelete: FF_Role.FF_Role_Admin,

	ui: {
		// layout: ({ key, type } = {}) => {
		// 	return {
		// 		key: key ?? 'default',
		// 		type: type ?? 'grid',
		// 		groups: [{
		// 			key: key ?? 'default',
		// 			fields: repo(Task).fields.toArray().filter((c) => c.apiUpdateAllowed()),
		// 		}]
		// 	}
		// },
	}
})
export class Task {
	@Fields.cuid()
	id!: string

	@Fields.createdAt()
	createdAt?: Date

	@Fields.string<Task>({
		ui: {
			placeholder: 'Enter a title',
			hint: 'This is a hint more <a style="color: orange;" href="https://firstly.fun">here</a>!',
			style: {
				span: 6,
			},
			field: {
				// hint: "hide"
			},
			// display: Title,
		},
		validate: (task) => {
			if (task.title.length < 3) throw 'The title must be at least 3 characters long'
		},
	})
	title: string = ''

	@Field(() => TaskTypeEnum, {
		ui: {
			style: {
				span: 3,
			},
		},
	})
	typeOfTask = TaskTypeEnum.EASY

	@Fields.number({
		ui: {
			style: {
				span: 3,
			},
		},
	})
	size = 0

	@Fields.boolean<Task>({
		allowApiUpdate(entity) {
			const isNew = entity ? getEntityRef(entity).isNew() : false
			return !isNew
		},
		ui: {
			style: {
				span: 3,
			},
		},
	})
	completed: boolean = false
}
