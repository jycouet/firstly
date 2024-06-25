<script lang="ts">
  import type { RemultKitDataAuth } from '../../../../../../remult-kit/src/lib/auth/types'
  import { autofocus } from '../helpers'

  export let remultKitDataAuth: RemultKitDataAuth
</script>

<div class="login">
  <form>
    <input
      use:autofocus
      type="text"
      placeholder={remultKitDataAuth.providers.password.dico.email_placeholder}
    />
    <button>{remultKitDataAuth.providers.password.dico.send_password_reset_instructions}</button>
  </form>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>
