<script lang="ts">
  
import { FieldGroup, kitStoreItem } from '../..'
  import { kitCellsBuildor } from '../../kitCellsBuildor'
  import { dialog, type DialogMetaDataInternal } from './dialog'
  import DialogPrimitive from './DialogPrimitive.svelte'
  import FormEditAction from './FormEditAction.svelte'

  export let toShow: DialogMetaDataInternal

  const cells = kitCellsBuildor(toShow.repo!, toShow.cells!)
  const store = toShow.store ?? kitStoreItem(toShow.repo!)

  $: {
    if (toShow.type === 'update' || toShow.type === 'view') {
      store.set({ item: toShow.defaults, errors: {}, loading: false, globalError: undefined })
    } else {
      store.create(toShow.defaults ?? {})
    }
  }

  const onCreate = (e: CustomEvent) => {
    dialog.close(toShow.id, { success: true, item: e.detail })
  }

  let isLoading = false
  const onInsert = async () => {
    isLoading = true
    try {
      const result = await store.save()
      if (result) {
        dialog.close(toShow.id, { success: true, item: result })
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
    const res = await dialog.confirmDelete('')
    if (res.success) {
      await store.delete()
      dialog.close(toShow.id, { success: true, item: $store.item })
    }
  }

  let loadOptionAt = new Date()
  const changed = (e: any) => {
    if (store.onChange(e.detail)) {
      loadOptionAt = new Date()
    }
  }
</script>

<DialogPrimitive
  detail={toShow.detail}
  open
  classes={{ root: toShow.classes?.root }}
  on:change={() => dialog.close(toShow.id, { success: false })}
>
  <form on:submit|preventDefault={onInsert}>
    <div class="grid {toShow.classes?.formGrid ?? ''} gap-4 pb-4">
      <FieldGroup
        {cells}
        {store}
        mode={toShow.type === 'view' ? 'view' : 'edit'}
        on:changed={changed}
        {loadOptionAt}
        on:createRequest={onCreate}
      />
    </div>

    <FormEditAction
      type={toShow.type}
      wDelete={toShow.wDelete}
      {store}
      on:delete={onDelete}
      textCreate={toShow.textCreate}
    ></FormEditAction>
  </form>
</DialogPrimitive>
