<script lang="ts">
  import { AuthController } from '../../../../../../remult-kit/src/lib/auth/AuthController'
  import type { RemultKitData } from '../../../../../../remult-kit/src/lib/auth/types'
  import { isError } from '../../../../../../remult-kit/src/lib/helper'
  import { autofocus } from '../helpers'

  export let remultKitData: RemultKitData

  export let view = 'login'
  export let indentifier = ''

  export let msgError = ''
  export let msgSuccess = ''

  let password: string
  let pincode: number

  async function signIn() {
    msgError = ''
    msgSuccess = ''
    try {
      await AuthController.signInPassword(indentifier, password)
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
      Username
      <input bind:value={indentifier} use:autofocus type="text" />
    </label>
    <label>
      Password
      <input bind:value={password} type="password" />
    </label>
    <button>Login</button>
  </form>
{/if}

{#if view == 'pin'}
  <form on:submit|preventDefault={handlePin}>
    <p>{msgError}{msgSuccess}</p>
    <label>
      PIN
      <input bind:value={pincode} use:autofocus type="number" placeholder="556775" />
    </label>
    <button>Confirm</button>
  </form>
{/if}

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
