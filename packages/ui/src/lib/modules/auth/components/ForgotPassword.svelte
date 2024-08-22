<script lang="ts">
  import { isError } from '../../../../../../firstly/src/lib'
  import { Auth } from '../../../../../../firstly/src/lib/auth/client'
  import type { firstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
  import { autofocus } from '../helpers'

  export let firstlyDataAuth: firstlyDataAuth
  export let email = ''

  let msgError = ''
  let msgSuccess = ''

  async function forgot() {
    // msgError = ''
    // msgSuccess = ''
    try {
      await Auth.forgotPassword(email)
      window.location.href = '/ff/auth/sign-in'
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }
</script>

<div class="login">
  <p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
  <form on:submit|preventDefault={forgot}>
    <input
      use:autofocus
      bind:value={email}
      type="text"
      placeholder={firstlyDataAuth.ui.providers.password.dico.email_placeholder}
    />
    <button>{firstlyDataAuth.ui.providers.password.dico.send_password_reset_instructions}</button>
  </form>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>
