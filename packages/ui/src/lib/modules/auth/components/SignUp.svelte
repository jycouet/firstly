<script lang="ts">
  import { AuthController } from '../../../../../../firstly/src/lib/auth'
  import type { firstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
  import { isError } from '../../../../../../firstly/src/lib/helper'
  import { autofocus } from '../helpers'

  // eslint-disable-next-line
  export let firstlyDataAuth: firstlyDataAuth

  export let view = 'login'
  export let email = ''

  let msgError = ''
  let msgSuccess = ''

  let password: string
  // let pincode: number
  let loading = false

  async function signIn() {
    msgError = ''
    msgSuccess = ''
    loading = true
    try {
      msgSuccess = await AuthController.signUpPassword(email, password)
      window.location.href = '/'
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
      loading = false
    } 
  }

  const handlePin = () => {
    throw new Error('Not impl yet')
  }
</script>

{#if view == 'login'}
	<form on:submit|preventDefault={signIn}>
		<p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
		<label>
			{firstlyDataAuth.ui?.strings.email}
			<input
				required
				bind:value={email}
				use:autofocus
				type="email"
				placeholder={firstlyDataAuth.ui?.strings.email_placeholder}
			/>
		</label>
		<label>
			{firstlyDataAuth.ui?.strings.password}
			<input
				required
				bind:value={password}
				type="password"
				placeholder={firstlyDataAuth.ui?.strings.password_placeholder}
			/>
		</label>
		<button disabled={!email || !password || loading}
			>{firstlyDataAuth.ui?.strings.btn_sign_up}</button
		>
	</form>
{/if}

<!-- {#if view == 'pin'}
  <form on:submit|preventDefault={handlePin}>
    <p>{msgError}{msgSuccess}</p>
    <label>
      PIN
      <input bind:value={pincode} use:autofocus type="number" placeholder="556775" />
    </label>
    <button>Confirm</button>
  </form>
{/if} -->

<style>
	form {
		display: flex;
		flex-direction: column;
	}
</style>
