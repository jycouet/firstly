import { ValueListFieldType } from 'remult'

import { KitBaseEnum } from '../KitBaseEnum'
import type { KitBaseEnumOptions } from '../KitBaseEnum'

import '../ui/LibIcon'

import { LibIcon_Add, LibIcon_Delete, LibIcon_Edit } from '../ui/LibIcon'

@ValueListFieldType()
export class StateDemoEnum extends KitBaseEnum {
	static CHECK = new StateDemoEnum('CHECK', {
		caption: 'Check',
		icon: {
			data: LibIcon_Add,
			class: 'text-primary',
		},
	})

	static EDIT = new StateDemoEnum('EDIT', {
		caption: 'Edit',
		icon: {
			data: LibIcon_Edit,
			class: 'text-secondary',
		},
	})

	static DELETE = new StateDemoEnum('DELETE', {
		caption: 'Delete',
		icon: {
			data: LibIcon_Delete,
			class: 'text-error',
		},
	})

	constructor(id: string, options?: KitBaseEnumOptions<StateDemoEnum>) {
		super(id, options)
	}
}
