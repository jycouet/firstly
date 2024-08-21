<script lang="ts">
  import { isError } from '../../../../../../firstly/src/lib'
  import { Auth } from '../../../../../../firstly/src/lib/auth/client'
  import type { firstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'

  export let firstlyDataAuth: firstlyDataAuth
  export let password1 = ''
  export let password2 = ''

  let msgError = ''
  let msgSuccess = ''

  async function reset() {
    msgError = ''
    msgSuccess = ''
    const token = new URL(location.href).searchParams.get('token')
    try {
      await Auth.resetPassword(token ?? '', password1)
      window.location.href = '/'
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }
</script>

<div class="login">
  <p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
  <form on:submit|preventDefault={reset}>
    {firstlyDataAuth.ui.providers.password.dico.password}
    <input bind:value={password1} type="password" />
    {firstlyDataAuth.ui.providers.password.dico.password}
    <input bind:value={password2} type="password" />
    <button>reset</button>
  </form>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>
