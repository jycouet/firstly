import {
  Entity,
  Fields,
  getEntityRef,
  IdEntity,
  isBackend,
  remult,
  type FieldRef,
  type FieldsRef,
  type LifecycleEvent,
} from 'remult'

import type { Module } from '../api'

@Entity<WithChangeLogs>('change_logs', {
  saved: async (entity, e) => {
    await recordSaved(entity, e)
  },
  deleted: async (entity, e) => {
    await recordDeleted(entity, e)
  },
})
export class WithChangeLogs {}

/**
 * in an entity, add these 2 functions:
 * ```ts
 *
 * \@Entity<Task>('tasks', {
 *   saved: async (entity, e) => {
 *     await recordSaved(entity, e)
 *   },
 *   deleted: async (entity, e) => {
 *     await recordDeleted(entity, e)
 *   },
 * })
 *
 * ```
 */
export const changeLog: () => Module = () => {
  return {
    name: 'changeLog',
    entities: [ChangeLog],
  }
}

@Entity<ChangeLog>('change_logs', {
  caption: 'Change Logs',
  allowApiCrud: false,
  defaultOrderBy: {
    changeDate: 'desc',
  },
})
export class ChangeLog {
  @Fields.cuid()
  id = ''

  @Fields.string()
  entity: string = ''

  @Fields.string()
  entityId: string = ''

  @Fields.date()
  changeDate: Date = new Date()

  @Fields.string()
  userId = ''

  @Fields.json({ dbName: 'changesJson' })
  changes: change[] = []

  @Fields.boolean()
  newRow = false

  @Fields.boolean()
  deleted = false
}

export interface changeEvent {
  date: Date
  userId: string
  changes: change[]
}

export interface change {
  key: string
  oldValue: string
  newValue: string
}

export async function recordSaved<entityType>(
  entity: entityType,
  e: LifecycleEvent<entityType>,
  options?: ColumnDeciderArgs<entityType>,
) {
  if (isBackend()) {
    const changes = [] as change[]
    const decider = new FieldDecider(entity, options)
    const isNew = options?.forceNew || e.isNew
    const changeDate = options?.forceDate || new Date()

    for (const c of decider.fields.filter((c) => c.valueChanged() || (isNew && c.value))) {
      try {
        const noVal = decider.excludedValues.includes(c)
        changes.push({
          key: c.metadata.key,
          newValue: noVal
            ? '***'
            : c.value instanceof IdEntity
              ? c.value.id
              : c.metadata.options.valueConverter!.toJson!(c.value),
          oldValue: e.isNew
            ? '---'
            : noVal
              ? '***'
              : c.originalValue instanceof IdEntity
                ? c.originalValue.id
                : c.metadata.options.valueConverter!.toJson!(c.originalValue),
        })
      } catch (err) {
        console.error(c)
        throw err
      }
    }

    if (changes.length > 0) {
      await remult.repo(ChangeLog).insert({
        changeDate,
        changes,
        entity: e.metadata.key,
        entityId: e.metadata.idMetadata.getId(entity),
        userId: remult.user?.id || '',
        newRow: isNew,
      })
    }
  }
}

export async function recordDeleted<entityType>(
  entity: entityType,
  e: LifecycleEvent<entityType>,
  options?: ColumnDeciderArgs<entityType>,
) {
  const changes = [] as change[]
  const decider = new FieldDecider(entity, options)
  const changeDate = options?.forceDate || new Date()

  for (const c of decider.fields) {
    try {
      const noVal = decider.excludedValues.includes(c)
      changes.push({
        key: c.metadata.key,
        newValue: noVal ? '***' : '---',
        oldValue: noVal
          ? '***'
          : c.originalValue instanceof IdEntity
            ? c.originalValue.id
            : c.metadata.options.valueConverter!.toJson!(c.originalValue),
      })
    } catch (err) {
      console.error(c)
      throw err
    }
  }

  await remult.repo(ChangeLog).insert({
    changeDate,
    changes,
    entity: e.metadata.key,
    entityId: e.metadata.idMetadata.getId(entity),
    userId: remult.user?.id || '',
    deleted: true,
  })
}

interface ColumnDeciderArgs<entityType> {
  excludeColumns?: (e: FieldsRef<entityType>) => FieldRef<entityType, any>[]
  excludeValues?: (e: FieldsRef<entityType>) => FieldRef<entityType, any>[]
  forceDate?: Date
  forceNew?: boolean
}

export class FieldDecider<entityType> {
  fields: FieldRef<entityType>[]
  excludedFields: FieldRef<entityType>[]
  excludedValues: FieldRef<entityType>[]
  constructor(entity: entityType, options?: ColumnDeciderArgs<entityType>) {
    const meta = getEntityRef(entity)
    if (!options?.excludeColumns) this.excludedFields = []
    // @ts-ignore
    else this.excludedFields = options.excludeColumns(meta.fields)
    if (!options?.excludeValues) this.excludedValues = []
    // @ts-ignore
    else this.excludedValues = options.excludeValues(meta.fields)
    this.excludedFields.push(
      ...meta.fields.toArray().filter((c) => c.metadata.options.serverExpression),
    )
    this.excludedFields.push(
      ...meta.fields.toArray().filter((c) => c.metadata.options.sqlExpression),
    )
    this.fields = meta.fields.toArray().filter((f) => !this.excludedFields.includes(f))
  }
}
