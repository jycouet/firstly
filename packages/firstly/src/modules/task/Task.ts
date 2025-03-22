import { Allow, Entity, Field, Fields, getEntityRef } from 'remult'

import { FF_Role } from '$lib'

import { TaskTypeEnum } from './TaskTypeEnum'
import Title from './ui/Title.svelte'

@Entity('task', {
	// allowApiCrud: Allow.authenticated,
	allowApiRead: true,
	allowApiInsert: Allow.authenticated,
	allowApiUpdate: Allow.authenticated,
	allowApiDelete: FF_Role.FF_Role_Admin,
})
export class Task {
	@Fields.cuid()
	id!: string

	@Fields.createdAt({ inputType: 'coucou' })
	createdAt?: Date

	@Fields.string<Task>({
		ui: {
			placeholder: 'Enter a title',
			hint: 'This is a hint more <a style="color: orange;" href="https://firstly.fun">here</a>!',
			style: {
				width: 60,
				span: 6,
				// start: 1,
				// end: 3,
			},
			// field: {
			// 	label: 'remove',
			// },
			// display: Title,
			// edit: TextField,
		},
		validate: (task) => {
			if (task.title.length < 3) throw 'The title must be at least 3 characters long'
		},
	})
	title: string = ''

	@Field(() => TaskTypeEnum, {
		ui: {
			// width: 20,
			style: {
				width: 40,
				// span: 3,
				// start: 2,
			},
		},
	})
	typeOfTask = TaskTypeEnum.EASY

	@Fields.number({
		ui: {
			style: {
				span: 2,
			},
		},
	})
	size = 0

	@Fields.boolean<Task>({
		allowApiUpdate(entity) {
			const isNew = entity ? getEntityRef(entity).isNew() : false
			return !isNew
		},
	})
	completed: boolean = false
}
