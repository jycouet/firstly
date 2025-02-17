<script lang="ts">
  import { repo } from 'remult'

  import { storeItem } from '$lib'
  import { cellsBuildor } from '$lib/cellsBuildor'
  import FieldGroup from '$lib/ui/FieldGroup.svelte'
  import { UIEntity } from '$lib/virtual/UIEntity'

  const repoUi = repo(UIEntity)

  const cells = cellsBuildor(repoUi, ['state'])

  const store = storeItem(repoUi)
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
