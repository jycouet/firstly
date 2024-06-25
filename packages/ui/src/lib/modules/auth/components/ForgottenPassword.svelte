<script lang="ts">
  import type { RemultKitDataKind } from '../../../../../../remult-kit/src/lib/auth'
  import { autofocus } from '../helpers'

  export let remultKitData: { props: RemultKitDataKind['auth'] }

  // Defaults
  $: if (!remultKitData) {
    remultKitData = {
      props: {
        paths: {
          base: '/kit/auth',
          sign_in: '/login',
          forgot_password: '/forgotten-password',
        },
      },
    }
  }
</script>

<div class="login">
  <form>
    <input use:autofocus type="text" placeholder="Your email address" />
    <button>Send password reset instructions</button>
  </form>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
</style>
