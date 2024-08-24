<script lang="ts">
  import type { BaseItem } from '$lib'
  import { Button } from '$lib'
  import { dialog } from '$lib/ui/dialog/dialog'
  import FieldContainer from '$lib/ui/internals/FieldContainer.svelte'
  import Input from '$lib/ui/internals/Input.svelte'
  import MultiSelectMelt from '$lib/ui/internals/select/MultiSelectMelt.svelte'
  import SelectMelt from '$lib/ui/internals/select/SelectMelt.svelte'

  import DemoDialog from './DemoDialog.svelte'
</script>

<div class="grid grid-cols-3 gap-4">
  <div>
    <Button
      on:click={async () => {
        const result1 = await dialog.show({ component: DemoDialog, detail: { caption: 'Hello ?' } })
        console.info(`result1`, result1)
        if (result1.success) {
          const result2 = await dialog.confirmDelete(`100% sure ?`)
          console.info(`result2`, result2)
        }
        console.info('done')
      }}
    >
      Show ???
    </Button>
  </div>
</div>
