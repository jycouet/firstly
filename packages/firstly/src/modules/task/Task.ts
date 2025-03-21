import { Allow, Entity, Field, Fields, getEntityRef } from 'remult'

import { FF_Role } from '../../lib/common.js'
import { TaskTypeEnum } from './TaskTypeEnum'
import Title from './ui/Title.svelte'

@Entity('task', {
	// allowApiCrud: Allow.authenticated,
	allowApiRead: true,
	allowApiInsert: Allow.authenticated,
	allowApiUpdate: Allow.authenticated,
	allowApiDelete: false,
})
export class Task {
	@Fields.cuid()
	id!: string

	@Fields.createdAt({ inputType: 'coucou' })
	createdAt?: Date

	@Fields.string<Task>({
		ui: {
			placeholder: 'Enter a title',
			hide: {
				// header: true,
			},
			position: {
				span: 6,
			},
			customField: {
				// edit: TextField,
			}
			// customField: { edit: true },
			// customField: { edit: createCustomField(EditCustom) },
		},
		validate: (task) => {
			if (task.title.length < 3) throw 'The title must be at least 3 characters long'
		},
	})
	title: string = ''

	@Field(() => TaskTypeEnum, {
		ui: {
			// width: 20,
			position: {
				span: 3,
			},
		},
	})
	typeOfTask = TaskTypeEnum.EASY

	@Fields.number({
		ui: {
			position: {
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
