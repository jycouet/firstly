import {
  dbNamesOf,
  getEntityRef,
  type ErrorInfo,
  type FieldMetadata,
  type Repository,
} from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { suffixWithS } from './formats/strings.js'
import { type KitBaseItem } from './index.js'

export function isError<T>(object: any): object is ErrorInfo<T> {
  return object
}

export const getFirstInterestingField = <Entity>(repo: Repository<Entity>) => {
  const fields = repo.metadata.fields.toArray()

  for (let i = 0; i < fields.length; i++) {
    // Let's find the most relevant field to display...
    if (
      fields[i].key !== 'id' &&
      fields[i].key !== 'createdAt' &&
      fields[i].options.skipForDefaultField !== true
    ) {
      return fields[i]
    }
  }

  return fields[0]
}

export const getEntityDisplayValue = <Entity>(
  repo: Repository<Entity>,
  row: Entity,
): KitBaseItem => {
  if (repo.metadata.options.displayValue) {
    return repo.metadata.options.displayValue(row)
  }

  const field = getFirstInterestingField(repo)
  // REMULT P3 JYC: If it's an enum, it's not working...
  return { caption: row ? field.displayValue(row) : '-', id: '' }
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

  const repo = getEntityRef(row).repository

  return { href: '', ...getEntityDisplayValue(repo, row) }
}

export type MetaTypeRelation = {
  kind: 'relation'
  subKind: 'reference' | 'toOne' | 'toMany'
  repoTarget: Repository<any>
  field: FieldMetadata
}
type MetaTypeEnum = {
  kind: 'enum'
  subKind: 'single' | 'multi'
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

  if (field.options?.inputType === 'selectArrayEnum') {
    return {
      kind: 'enum',
      subKind: 'multi',
      // // @ts-ignore
      // values: getEnums(field.target) as KitBaseItem[],
      // @ts-ignore
      values: field.options.valueConverter.values as KitBaseItem[],
      field,
    }
  }

  // REMULT P2 JYC: Any idea to know if it's an enum? and extract values?
  // const ttt = getValueList(field)
  // console.log(`ttt`, ttt)
  // Error: ValueType not yet initialized, did you forget to call @ValueListFieldType on function String()
  // is it an enum?
  // @ts-ignore
  if (field.options?.valueConverter?.values) {
    // console.log(`field.options.valueConverter.values`, field.options.valueConverter.values)

    return {
      kind: 'enum',
      subKind: 'single',
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

/**
 * same as `dbNamesOf` but with `tableName` set to `true` by default
 */
export const kitDbNamesOf = async <Entity>(...p: Parameters<typeof dbNamesOf<Entity>>) => {
  return dbNamesOf(p[0], { tableName: true, ...p[1] })
}
