<script lang="ts">
  import { Link, Route } from 'svelte-micro'

  import type { RemultKitData } from '../../../../../remult-kit/src/lib/auth/types'
  import ForgottenPassword from './components/ForgottenPassword.svelte'
  import Login from './components/Login.svelte'

  export let remultKitData: RemultKitData

  $: sign_in = remultKitData.props.paths.base + remultKitData.props.paths.sign_in
  $: forgot_password = remultKitData.props.paths.base + remultKitData.props.paths.forgot_password
</script>

<div class="wrapper">
  <div class="form">
    <Route>
      <Route path={sign_in}>
        <Login {remultKitData} />

        <div class="form-footer">
          <Link href={forgot_password}>Forgot your password?</Link>
        </div>
      </Route>

      <Route path={forgot_password}>
        <ForgottenPassword {remultKitData} />

        <div class="form-footer">
          <Link href={sign_in}>Back to login</Link>
        </div>
      </Route>

      <Route fallback>
        <div class="fallback">
          <small>- 404 -</small>
        </div>
        <div class="fallback">
          <small>Nothing to see here</small>
        </div>
      </Route>
    </Route>
  </div>
</div>

<style>
  .wrapper {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
  }

  .form {
    padding: 1rem;
    max-width: 360px;
    width: 100%;
  }

  .form-footer {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .fallback {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
