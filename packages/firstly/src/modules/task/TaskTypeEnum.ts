import { BaseEnum, LibIcon_Add, LibIcon_Delete, type BaseEnumOptions } from "../../lib"
import { ValueListFieldType } from "remult"
import type { Task } from "./Task"

// FIXME: jyc todo
// @ValueListFieldType()
// export class TaskTypeEnum extends BaseEnum {
// 	static EASY = new TaskTypeEnum('EASY', {
// 		caption: 'Easy',
// 		icon: { data: LibIcon_Add },
// 	})
// 	static HARD = new TaskTypeEnum('HARD', {
// 		caption: 'Hard',
// 		icon: { data: LibIcon_Delete },
// 	})
// 	constructor(id: string, o?: BaseEnumOptions<Task>) {
// 		super(id, o)
// 	}
// }
@ValueListFieldType()
export class TaskTypeEnum {
	static EASY = new TaskTypeEnum('EASY', {
		caption: 'Easy',
		icon: { data: LibIcon_Add },
	})
	static HARD = new TaskTypeEnum('HARD', {
		caption: 'Hard',
		icon: { data: LibIcon_Delete },
	})
	constructor(id: string, o?: BaseEnumOptions<Task>) {
		
	}
}