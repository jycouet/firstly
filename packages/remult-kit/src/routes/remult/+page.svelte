<script lang="ts">
  import { FieldGroup, kitCellsBuildor, kitStoreItem, UIEntity } from '$lib'

  const cells = kitCellsBuildor(UIEntity, [
    'state',
    'id',
    'createdAt',
    'updatedAt',
    'username',
    'email',
    'password',
    'permissions',
    'cuid',
    'isSubContractor',
    'rate',
    'arrivalDate',
    'arrivalDateOnly',
  ])

  const store = kitStoreItem(UIEntity)
  $: store.fetch(-1)

  let isEdit = true
</script>

<form>
  <button
    on:click={() => {
      isEdit = !isEdit
    }}
    class="btn btn-primary">Edit</button
  >
  <div class="grid grid-cols-3 gap-4">
    <FieldGroup {cells} {store} mode={isEdit ? 'edit' : 'view'} />
  </div>
</form>
