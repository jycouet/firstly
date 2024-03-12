<script lang="ts">
  import { writable } from 'svelte/store'

  import { FieldGroup, getEntityDisplayValue } from '../..'
  import { kitCellsBuildor } from '../../kitCellsBuildor'
  import { kitStoreItem } from '../../kitStoreItem'
  import { dialog, type DialogMetaDataInternal } from './dialog'
  import DialogPrimitive from './DialogPrimitive.svelte'
  import FormEditAction from './FormEditAction.svelte'

  export let toShow: DialogMetaDataInternal
  const cells = kitCellsBuildor(toShow.entity!, toShow.buildor!)
  const store = kitStoreItem(toShow.entity!)

  $: {
    if (toShow.type === 'update' || toShow.type === 'view') {
      store.set({ item: toShow.defaults, errors: {}, loading: false, globalError: undefined })
    } else {
      store.create(toShow.defaults ?? {})
    }
  }

  let isLoading = false
  const add = async () => {
    isLoading = true
    try {
      const result = await store.save()
      const item = getEntityDisplayValue(toShow.entity!, result)

      if (result) {
        dialog.close(toShow.id, { success: true, item })
      }
    } catch (e) {
      // in some cases we don't want to throw.
      // Example: linking ppl to contrat - it is a relation and when adding
      // the same relation it errors on duplicate key. We can ignore it
      if (!toShow.noThrow) {
        throw e
      }
    } finally {
      isLoading = false
    }
  }

  const onDelete = async () => {
    if ((await dialog.confirmDelete('')).success) {
      await store.deleteMe()
      dialog.close(toShow.id, { success: true })
    }
  }

  const dynamicSelector = writable<any>([])

  const getDynamicBuildor = () => {
    const filteredCols = cells.filter((b) => b.filter?.on)
    if (!filteredCols.length) {
      return
    }
    filteredCols.forEach((col) => {
      if (!col) {
        return
      }
      const relatedCol = cells.find((b) => b.col === col.filter?.on)
      if (!relatedCol?.col) {
        return
      }
      if ($store.item[relatedCol.col] && col.filter) {
        const cell = cells.find((c) => c?.field?.key === relatedCol.col)
        if (cell?.field?.options) {
          // @ts-ignore
          col.filter.where = { [cell.field.options.field]: $store.item[cell.field.options.field] }
        }
      }
    })
    $dynamicSelector = [...cells]
  }

  $: $dynamicSelector = cells
  $: $store.item && getDynamicBuildor()
</script>

<DialogPrimitive
  detail={toShow.detail}
  open
  classes={{ root: toShow.classes?.root }}
  on:change={() => dialog.close(toShow.id, { success: false })}
>
  <form on:submit|preventDefault={add}>
    <div class="grid {toShow.classes?.formGrid ?? ''} gap-4 pb-4">
      <FieldGroup {cells} {store} mode={toShow.type === 'view' ? 'view' : 'edit'} />
    </div>

    <FormEditAction {toShow} {store} on:delete={onDelete}></FormEditAction>
  </form>
</DialogPrimitive>
