<script lang="ts">
  import { Auth } from '../../../../../../firstly/src/lib/auth/client'
  import type { firstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
  import { isError } from '../../../../../../firstly/src/lib/helper'
  import { autofocus } from '../helpers'

  export let firstlyDataAuth: firstlyDataAuth

  export let view = 'login'
  export let email = ''

  let msgError = ''
  let msgSuccess = ''

  let password: string
  // let pincode: number

  async function signIn() {
    msgError = ''
    msgSuccess = ''
    try {
      await Auth.signUpPassword(email, password)
      window.location.href = '/'
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
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
        bind:value={email}
        use:autofocus
        type="text"
        placeholder={firstlyDataAuth.ui?.strings.email_placeholder}
      />
    </label>
    <label>
      {firstlyDataAuth.ui?.strings.password}
      <input bind:value={password} type="password" />
    </label>
    <button>{firstlyDataAuth.ui?.strings.btn_sign_up}</button>
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

  .message:empty {
    display: none;
  }

  .message {
    background: var(--pico-muted-border-color);
    padding: var(--pico-form-element-spacing-vertical) var(--pico-form-element-spacing-horizontal);
    border-radius: var(--pico-border-radius);
    margin-bottom: calc(var(--pico-typography-spacing-vertical) * 2);
  }

  .message.error {
    background: var(--pico-del-color);
    color: #4c1513;
  }
</style>
