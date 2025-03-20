import { Allow, Entity, Field, Fields, getEntityRef } from 'remult'

import { FF_Role } from '../../lib/common.js'
import { TaskTypeEnum } from './TaskTypeEnum'


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

	@Fields.createdAt()
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
			// customField: true,
			// customField: createCustomField(Title)
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

	@Fields.boolean<Task>({
		allowApiUpdate(entity) {
			const isNew = entity ? getEntityRef(entity).isNew() : false
			return !isNew
		},
	})
	completed: boolean = false
}
