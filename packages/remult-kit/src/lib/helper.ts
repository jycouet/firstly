import { remult, type ErrorInfo, type FieldMetadata, type Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { suffixWithS } from './formats/strings.js'
import type { KitBaseItem } from './index.js'

export function isError<T>(object: any): object is ErrorInfo<T> {
  return object
}

export const getEntityDisplayValue = <Entity>(
  // for the developer!
  whereAreWe: string,
  repo: Repository<Entity>,
  row: Entity,
): KitBaseItem => {
  if (!repo.metadata.options.displayValue) {
    const fields = repo.metadata.fields.toArray()
    for (let i = 0; i < fields.length; i++) {
      // Let's find the most relevant field to display...
      if (
        fields[i].key !== 'id' &&
        fields[i].key !== 'createdAt' &&
        fields[i].options.skipForDefaultField !== true
      ) {
        return { caption: fields[i].displayValue(row), id: '' }
      }
    }

    return { caption: 'NOTHING Found as a good default', id: 'NOTHING' }
  }

  return repo.metadata.options.displayValue(row)
}

export const getFieldLinkDisplayValue = (
  field: FieldMetadata,
  row: any,
): KitBaseItem & { href: string } => {
  const caption = field.displayValue(row)

  let href = ''
  if (field.options.href) {
    href = field.options.href(row)
  }

  return { id: '', caption, href }
}

export const getEntityDisplayValueFromField = (
  field: FieldMetadata,
  row: any,
): KitBaseItem & { href: string } => {
  if (row === null || row === undefined) {
    return { href: '/', id: '', caption: '-' }
  }

  // REMULT BUG https://github.com/remult/remult/issues/239
  // const repo = remult.repo(field.target)
  // @ts-ignore
  const repo = remult.repo(field.entityDefs.entityType)
  // console.log(`field.entityDefs.entityType`, field.entityDefs.entityType)
  // console.log(`field.target`, field.target)

  return { href: '', ...getEntityDisplayValue('Grid.svelte', repo, row) }
}

export type MetaTypeRelation = {
  kind: 'relation'
  subKind: 'reference' | 'toOne' | 'toMany'
  repoTarget: Repository<any>
  field: FieldMetadata
}
type MetaTypeEnum = {
  kind: 'enum'
  subKind: '???'
  values: KitBaseItem[]
  field: FieldMetadata
}
type MetaTypePrimitive = {
  kind: 'primitive'
  subKind: string
  field: FieldMetadata
}
type MetaTypeSlot = { kind: 'slot'; subKind: '???' }
export type FieldMetaType = MetaTypeRelation | MetaTypeEnum | MetaTypePrimitive | MetaTypeSlot

// or it's a slot or it will return the field
export const getFieldMetaType = (field?: FieldMetadata): FieldMetaType => {
  if (field === undefined) {
    return { kind: 'slot', subKind: '???' }
  }
  // is it a relation?
  const fieldRelationInfo = getRelationFieldInfo(field)
  if (fieldRelationInfo) {
    return {
      kind: 'relation',
      subKind: fieldRelationInfo.type,
      repoTarget: fieldRelationInfo.toRepo,
      field,
    }
  }

  // REMULT TODO
  // is it any enum?
  // @ts-ignore
  if (field.options?.valueConverter?.values) {
    return {
      kind: 'enum',
      subKind: '???',
      // @ts-ignore
      values: field.options.valueConverter.values as KitBaseItem[],
      field,
    }
  }

  // it's a primitive
  return { kind: 'primitive', subKind: field.inputType ?? 'text', field }
}

export const displayWithDefaultAndSuffix = (
  field: FieldMetadata<any, any> | undefined,
  value: any,
) => {
  const toRet = []
  // TODO: This method should be reviewed. Specifically, server expression & Field.date have
  // valueConverter by defualt, so we can't use displayValue if checking for valueConverter
  // Hummm... JYC: I didn't understand the above comment.
  if (field && field.valueConverter?.displayValue && !field.isServerExpression) {
    toRet.push(field.valueConverter?.displayValue(value) ?? '-')
  } else {
    // toRet.push(value ?? '-')
    toRet.push(field?.displayValue ? field?.displayValue({ [field.key]: value }) : value ?? '-')
  }

  if (value === undefined || value === null) {
    return ''
  }

  if (field?.options.suffix) {
    if (field.options.suffixWithS) {
      toRet.push(suffixWithS(value, field.options.suffix))
    } else {
      toRet.push(field.options.suffix)
    }
  }
  return toRet.join(' ')
}
