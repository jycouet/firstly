import type { SvelteComponent } from 'svelte'

import { type ClassType, type EntityFilter, type FieldMetadata, type Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { BaseEnum } from './BaseEnum.js'
import { getEnum } from './helper.js'
import type { UnArray } from './utils/types.js'

export type VisibilityMode = 'view' | 'edit' | 'hide'

type CellInternal<Entity> = {
  col?: keyof Entity
  kind?:
    | 'field' // using the std displayValue of the field
    | 'field_link' // using the href of the field (if href is set, let's put this mode by default for the field)
    | 'entity_link' // using the displayValue of an entity (if it's a primitive, this entity, if it's a relation, the relation entity)
    | 'slot' // full custom
    | 'header' // just string for display, uses the header. e.g. a title of a group
    | 'component'
    | 'baseItem'

  class?: string // 'col-span-2' for example
  header?: string // always beter to update the caption of the field or of the class...
  headerSlot?: boolean // add a custom header as slot to a slot field

  modeEdit?: VisibilityMode
  modeView?: VisibilityMode

  clipboardable?: boolean // if true, will add a copy button to the field
  clearable?: boolean // for select

  component?: new (...args: any[]) => SvelteComponent
  props?: any
  rowToProps?: (row: any) => any
}

export type Cell<Entity> = CellInternal<Entity> & {
  field?: FieldMetadata<any, Entity>
}

export type CellsInput<Entity> = (keyof Entity | CellInternal<Entity>)[]

/**
 * cellsBuildor is a function to build cells for a <Grid /> or <FieldGroup /> component.
 *
 * ```html
 * <script lang="ts">
 *   import { repo } from 'remult'
 *
 *   const cells = cellsBuildor(repo(Site), ['name', 'description'])
 *   const store = storeList( repo(Site) )
 *   $: store.fetch()
 * </script>
 *
 * <Grid {cells} {store} />
 * ```
 *
 */
export function cellsBuildor<Entity>(
  repo: Repository<Entity>,
  inputBuildor: CellsInput<Entity>,
): Cell<Entity>[] {
  const buildor: Cell<Entity>[] = []

  for (let i = 0; i < inputBuildor.length; i++) {
    const item = inputBuildor[i]

    let b: Cell<Entity>
    if (item instanceof Object) {
      b = { ...item, field: repo.fields[item.col] }
    } else {
      b = { col: item, field: repo.fields[item] }
    }

    // Let's tweak defaults...
    if (b.kind === undefined) {
      if (b.field?.options.href) {
        b.kind = 'field_link'
      }
    }

    buildor.push(b)
  }

  return buildor
}

export function cellBuildor<Entity>(
  repo: Repository<Entity>,
  inputBuildor: UnArray<CellsInput<Entity>>,
) {
  return cellsBuildor(repo, [inputBuildor])[0]
}

export const fieldsOf = <Entity>(b: Cell<Entity>[]) => {
  return b.filter((c) => c.field).map((c) => c.field!) ?? []
}

export const getPlaceholder = <Entity>(fields: FieldMetadata<any, Entity>[]) => {
  return fields.map((c) => c.caption).join(', ')
}

export const buildSearchWhere = <Entity>(
  entity: ClassType<Entity> | undefined,
  fields: FieldMetadata<any, Entity>[],
  search?: string | null,
): EntityFilter<Entity>[] => {
  if (!search) {
    return []
  }

  const f: EntityFilter<any>[] = [
    {
      $or: fields.map((f) => {
        // REMULT P1: isServerExpression is false when sqlExpression there ?!
        // if (f.isServerExpression || f.options.sqlExpression) {
        // check if this field has a specific filter function
        const fnName = f.key + 'Filter'
        // @ts-ignore
        if (entity && entity[fnName]) {
          // @ts-ignore
          return entity[fnName](search)
        }

        // let's continue with the default behavior
        // return {}
        // }

        if (f.inputType === 'number') {
          return { [f.key]: search }
        }

        return containsWords([f], search)
      }),
    },
  ]
  return f
}

export const containsWords = <Entity>(
  fields: FieldMetadata<any, Entity>[],
  search: string,
): EntityFilter<Entity> => {
  const sSplitted = search.split(' ').filter((s) => s.length > 0)

  if (fields.length === 1) {
    return {
      $and: sSplitted.map((s) => ({ [fields[0].key]: { $contains: s } })),
    } as EntityFilter<Entity>
  }

  return {
    $or: fields.map((f) => {
      return { $and: sSplitted.map((s) => ({ [f.key]: { $contains: s } })) }
    }),
  } as EntityFilter<Entity>
}

export const buildWhere = <Entity>(
  entity: ClassType<Entity> | undefined,
  defaultWhere: EntityFilter<Entity> | undefined,
  fields_filter: FieldMetadata<any, Entity>[],
  fields_search: FieldMetadata<any, Entity>[],
  obj: Record<string, string>,
): EntityFilter<Entity> => {
  const and: EntityFilter<Entity>[] = []

  if (defaultWhere) {
    and.push(defaultWhere)
  }

  if (obj.search) {
    and.push(...buildSearchWhere(entity, fields_search, obj.search))
  }
  for (const field of fields_filter) {
    // if there is a value
    if (obj[field.key]) {
      const rfi = getRelationFieldInfo(field)
      if (field.inputType === 'checkbox') {
        // @ts-ignore
        and.push({ [field.key]: obj[field.key] })
      } else if (field.inputType === 'selectEnum') {
        const fnName = field.key + 'Filter'
        // @ts-ignore
        if (entity && entity[fnName]) {
          // @ts-ignore
          and.push(entity[fnName](obj[field.key]))
        } else {
          // @ts-ignore
          const theEnum = getEnum(field, obj[field.key])
          // Take the where of the enum if it exists, or it's using this selection as a filter
          if (theEnum?.where) {
            and.push(theEnum.where)
          } else {
            const wheretoUse = theEnum?.where ?? new BaseEnum(obj[field.key])
            // @ts-ignore
            and.push({ [field.key]: wheretoUse })
          }
        }
      } else if (rfi?.type === 'toOne') {
        // @ts-ignore (setting the id of the relation)
        and.push({ [field.key]: obj[field.key] })
      } else {
        console.info(`Not handled filter field ${field.key} ${field.inputType}`)
      }
    }
  }

  // @ts-ignore
  return { $and: and }
}
