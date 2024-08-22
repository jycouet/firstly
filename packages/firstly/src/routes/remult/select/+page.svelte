<script lang="ts">
  import { remult } from 'remult'

  import { storeItem } from '$lib'
  import { cellsBuildor } from '$lib/cellsBuildor'
  import FieldGroup from '$lib/ui/FieldGroup.svelte'
  import { FF_Entity } from '$lib/virtual/FF_Entity'

  const repo = remult.repo(FF_Entity)

  const cells = cellsBuildor(repo, ['state'])

  const store = storeItem(repo)
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
