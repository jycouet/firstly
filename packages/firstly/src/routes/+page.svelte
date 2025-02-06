<script lang="ts">
  import { remult } from 'remult'

  import { AuthController } from '$lib/auth'
  import Button from '$lib/ui/Button.svelte'
</script>

<div class="flex flex-col gap-4">
  {#if remult.user}
    <div class="flex justify-between">
      <div class="text-2xl">
        Welcome <b>{remult.user?.name}</b>
      </div>
      <div>
        <Button
          class="btn-outline btn-warning"
          on:click={async () => {
            await AuthController.signOut()
            window.location.href = '/'
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  {:else}
    <div class="text-2xl">
      Welcome <b>👋</b>
    </div>
  {/if}
</div>
