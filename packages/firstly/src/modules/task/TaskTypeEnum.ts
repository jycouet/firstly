import { ValueListFieldType } from 'remult'

import { BaseEnum, type BaseEnumOptions } from '../../lib/internals/BaseEnum.js'
import { LibIcon_Add, LibIcon_Delete } from '../../lib/ui/LibIcon.js'
import type { Task } from './Task'

@ValueListFieldType()
export class TaskTypeEnum extends BaseEnum {
	static EASY = new TaskTypeEnum('EASY', {
		caption: 'Easy',
		icon: { data: LibIcon_Add },
	})
	static HARD = new TaskTypeEnum('HARD', {
		caption: 'Hard',
		icon: { data: LibIcon_Delete },
	})
	constructor(id: string, o?: BaseEnumOptions<Task>) {
		super(id, o)
	}
}
