<script lang="ts">
  import { remult } from 'remult'

  import { cellsBuildor, FF_Entity, FieldGroup, storeItem } from '$lib'

  const repo = remult.repo(FF_Entity)

  const cells = cellsBuildor(repo, [
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

  const store = storeItem(repo)
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
