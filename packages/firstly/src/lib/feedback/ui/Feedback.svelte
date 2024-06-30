<script lang="ts">
  import { dialog } from '../../'
  import DialogMilestones from './DialogMilestones.svelte'

  const list = async () => {
    await dialog.show({
      component: DialogMilestones,
      classes: { root: 'overflow-auto w-5/6 h-5/6' },
      detail: { caption: 'Feedback' },
    })
  }
</script>

<button class="text-secondary" on:click={list}>Feedback</button>
