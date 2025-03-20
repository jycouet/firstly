import { Allow, Entity, Field, Fields, getEntityRef, ValueListFieldType } from 'remult'

import { createCustomField } from '$lib/svelte/createCustomField'

import { BaseEnum, FF_Role, LibIcon_Add, LibIcon_Delete, type BaseEnumOptions } from '../../lib'
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

	@Field(() => TypeOfTaskEnum, {
		ui: {
			// width: 20,
			position: {
				span: 3,
			},
		},
	})
	typeOfTask = TypeOfTaskEnum.EASY

	@Fields.boolean<Task>({
		allowApiUpdate(entity) {
			const isNew = entity ? getEntityRef(entity).isNew() : false
			return !isNew
		},
	})
	completed: boolean = false
}

@ValueListFieldType()
export class TypeOfTaskEnum extends BaseEnum {
	static EASY = new TypeOfTaskEnum('EASY', {
		caption: 'Easy',
		icon: { data: LibIcon_Add },
	})
	static HARD = new TypeOfTaskEnum('HARD', {
		caption: 'Hard',
		icon: { data: LibIcon_Delete },
	})
	constructor(id: string, o?: BaseEnumOptions<TypeOfTaskEnum>) {
		super(id, o)
	}
}
