<script lang="ts">
  import { isError } from '../../../../../../firstly/src/lib'
  import { AuthController } from '../../../../../../firstly/src/lib/auth'
  import type { firstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
  import { autofocus } from '../helpers'

  // eslint-disable-next-line
  export let firstlyDataAuth: firstlyDataAuth
  export let email = ''

  let msgError = ''
  let msgSuccess = ''
  let loading = false

  async function forgot() {
    // msgError = ''
    // msgSuccess = ''
    loading = true
    try {
      await AuthController.forgotPassword(email)
      window.location.href = '/ff/auth/sign-in'
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    } finally {
      loading = false
    }
  }
</script>

<div class="login">
  <p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
  <form on:submit|preventDefault={forgot}>
    <input
      required
      use:autofocus
      bind:value={email}
      type="text"
      placeholder={firstlyDataAuth.ui?.strings.email_placeholder}
    />
    <button disabled={!email || loading}
      >{firstlyDataAuth.ui?.strings.send_password_reset_instructions}</button
    >
  </form>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>
