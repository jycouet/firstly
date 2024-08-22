import { ValueListFieldType } from 'remult'

import { BaseEnum } from '../BaseEnum'
import type { BaseEnumOptions } from '../BaseEnum'

import '../ui/LibIcon'

import { LibIcon_Add, LibIcon_Delete, LibIcon_Edit } from '../ui/LibIcon'

@ValueListFieldType()
export class StateDemoEnum extends BaseEnum {
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

  constructor(id: string, options?: BaseEnumOptions<StateDemoEnum>) {
    super(id, options)
  }
}
