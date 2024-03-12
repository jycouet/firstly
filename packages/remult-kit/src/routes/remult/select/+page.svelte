<script lang="ts">
  import { kitStoreItem } from '$lib'
  import { kitCellsBuildor } from '$lib/kitCellsBuildor'
  import FieldGroup from '$lib/ui/FieldGroup.svelte'
  import { UIEntity } from '$lib/virtual/UIEntity'

  const cells = kitCellsBuildor(UIEntity, ['state'])

  const store = kitStoreItem(UIEntity)
  store.fetch(-1)
</script>

<div class="grid grid-cols-3 gap-4">
  <FieldGroup {cells} {store} />
  <div></div>
  <div></div>

  <div>
    Data
    <pre>{JSON.stringify($store, null, 2)}</pre>
  </div>
</div>
