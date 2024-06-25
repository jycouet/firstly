import type { FieldMetadata } from 'remult'

import type { KitCell } from '../'

export type Align = 'text-left' | 'text-center' | 'text-right'

export const align = (f?: FieldMetadata, isSlot?: boolean): Align => {
  if (isSlot) {
    return 'text-center'
  }
  if (f?.inputType === 'number') {
    return 'text-right'
  } else if (f?.inputType === 'date' || f?.inputType === 'dateOnly') {
    return 'text-center'
  }
  return 'text-left'
}

export const getAligns = (cells: KitCell<any>[], withAction: boolean) => {
  const cols = [...cells.map((c) => align(c.field, c.kind === 'slot'))]
  if (withAction) {
    cols.push('text-right')
  }
  return cols
}
