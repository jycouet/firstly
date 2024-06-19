import type { SvelteComponent } from 'svelte'

import { type EntityFilter, type FieldMetadata, type Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import { getEnum, KitBaseEnum } from './KitBaseEnum.js'
import type { UnArray } from './utils/types.js'

type KitCellInternal<Entity> = {
  col?: keyof Entity
  kind?:
    | 'field' // using the std displayValue of the field
    | 'field_link' // using the href of the field (if href is set, let's put this mode by default for the field)
    | 'entity_link' // using the displayValue of an entity (if it's a primitive, this entity, if it's a relation, the relation entity)
    | 'slot' // full custom
    | 'header' // just string for display, uses the header. e.g. a title of a group
    | 'component'

  class?: string // 'col-span-2' for example
  header?: string // always beter to update the caption of the field or of the class...
  headerSlot?: boolean // add a custom header as slot to a slot field

  modeEdit?: 'view' | 'edit' | 'hide'
  modeView?: 'view' | 'edit' | 'hide'

  clipboardable?: boolean // if true, will add a copy button to the field
  clearable?: boolean // for select

  component?: new (...args: any[]) => SvelteComponent
  props?: any
  rowToProps?: (row: any) => any
}

export type KitCell<Entity> = KitCellInternal<Entity> & {
  field?: FieldMetadata<any, Entity>
}

export type KitCellsInput<Entity> = (keyof Entity | KitCellInternal<Entity>)[]

/**
 * kitCellsBuildor is a function to build cells for a <Grid /> or <FieldGroup /> component.
 *
 * ```html
 * <script lang="ts">
 *   import { repo } from 'remult'
 *
 *   const cells = kitCellsBuildor(repo(Site), ['name', 'description'])
 *   const store = kitStoreList( repo(Site) )
 *   $: store.fetch()
 * </script>
 *
 * <Grid {cells} {store} />
 * ```
 *
 */
export function kitCellsBuildor<Entity>(
  repo: Repository<Entity>,
  inputBuildor: KitCellsInput<Entity>,
): KitCell<Entity>[] {
  const buildor: KitCell<Entity>[] = []

  for (let i = 0; i < inputBuildor.length; i++) {
    const item = inputBuildor[i]

    let b: KitCell<Entity>
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

export function kitCellBuildor<Entity>(
  repo: Repository<Entity>,
  inputBuildor: UnArray<KitCellsInput<Entity>>,
) {
  return kitCellsBuildor(repo, [inputBuildor])[0]
}

export const fieldsOf = <Entity>(b: KitCell<Entity>[]) => {
  return b.filter((c) => c.field).map((c) => c.field!) ?? []
}

export const getPlaceholder = <Entity>(fields: FieldMetadata<any, Entity>[]) => {
  return fields.map((c) => c.caption).join(', ')
}

export const buildSearchWhere = <Entity>(
  fields: FieldMetadata<any, Entity>[],
  search?: string | null,
): EntityFilter<Entity>[] => {
  if (!search) {
    return []
  }

  const f: EntityFilter<any>[] = [
    {
      $or: fields.map((f) => {
        if (f.inputType === 'number') {
          return { [f.key]: search }
        }

        const sSplitted = search.split(' ')
        return {
          $and: sSplitted.map((s) => ({ [f.key]: { $contains: s } })),
        }
      }),
    },
  ]
  return f
}

export const buildWhere = <Entity>(
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
    and.push(...buildSearchWhere(fields_search, obj.search))
  }
  for (const field of fields_filter) {
    const rfi = getRelationFieldInfo(field)

    // if there is a value
    if (obj[field.key]) {
      if (field.inputType === 'checkbox') {
        // @ts-ignore
        and.push({ [field.key]: obj[field.key] })
      } else if (field.inputType === 'selectEnum') {
        // @ts-ignore
        const theEnum = getEnum(field, obj[field.key])
        // Take the where of the enum if it exists, or it's using this selection as a filter
        // @ts-ignore
        const wheretoUse = theEnum?.where ?? new KitBaseEnum(obj[field.key])
        // @ts-ignore
        and.push({ [field.key]: wheretoUse })
      } else if (rfi.type === 'toOne') {
        // @ts-ignore (stting the id of the relation)
        and.push({ [field.key]: obj[field.key] })
      } else {
        console.info(`Not handled filter field ${field.key} ${field.inputType}`)
      }
    }
  }

  // @ts-ignore
  return { $and: and }
}
