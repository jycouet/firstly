<script lang="ts">
  import { remult } from 'remult'

  // import { Auth } from '$lib/auth/client'
  import { route } from '$lib/ROUTES'
  import Button from '$lib/ui/Button.svelte'
</script>

<div class="flex flex-col gap-4">
  <div>Home 👋</div>
  <div class="text-2xl">
    Welcome <b>{remult.user?.name}</b>
  </div>

  {#if remult.user}
    <Button
      class="btn-outline btn-warning"
      on:click={async () => {
        // await Auth.signOut()
        window.location.href = '/'
      }}
    >
      Sign out
    </Button>
  {:else}
    <a class="btn btn-primary" href={route('firstly_sign_in')}>Auth</a>
  {/if}
</div>
