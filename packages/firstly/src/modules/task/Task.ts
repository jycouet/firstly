import { Allow, Entity, Field, Fields, ValueListFieldType } from 'remult'

import { BaseEnum, LibIcon_Add, LibIcon_Delete, type BaseEnumOptions } from '../../lib'
import Title from './ui/Title.svelte'
import { createCustomField } from '$lib/svelte/createCustomField'

@Entity('task', {
	allowApiCrud: Allow.authenticated,
})
export class Task {
	@Fields.cuid()
	id!: string

	@Fields.createdAt()
	createdAt?: Date

	@Fields.string<Task>({
		ui: {
			placeholder: 'Enter a title',
			// width: 50,
			hide: {
				// header: true,
			},
			customField: true,
			// customField: createCustomField(Title)
		},
		validate: (task) => {
			if (task.title.length < 3) throw 'The title must be at least 3 characters long'
		},
	})
	title: string = ''

	@Field(() => TypeOfTaskEnum, {
		ui: {
			width: 20,
			
		},
	})
	typeOfTask = TypeOfTaskEnum.EASY
	
	@Fields.boolean()
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
