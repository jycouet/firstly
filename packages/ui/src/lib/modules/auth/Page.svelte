<script lang="ts">
  import { Link, Route } from 'svelte-micro'

  import type { RemultKitData } from '../../../../../remult-kit/src/lib/auth/types'
  import ForgotPassword from './components/ForgotPassword.svelte'
  import ResetPassword from './components/ResetPassword.svelte'
  import SignIn from './components/SignIn.svelte'
  import SignUp from './components/SignUp.svelte'

  export let remultKitData: RemultKitData
  let remultKitDataAuth = remultKitData.props
</script>

<div class="wrapper">
  <div class="form">
    <Route>
      <Route path={remultKitDataAuth.ui.providers.password.paths.sign_up}>
        <SignUp {remultKitDataAuth} />

        <div class="form-footer">
          {#if remultKitDataAuth.ui.providers.password.paths.sign_in}
            <Link href={remultKitDataAuth.ui.providers.password.paths.sign_in}>
              {remultKitDataAuth.ui.providers.password.dico.back_to_sign_in}
            </Link>
          {/if}
        </div>
      </Route>

      <Route path={remultKitDataAuth.ui.providers.password.paths.sign_in}>
        <SignIn {remultKitDataAuth} />

        <div class="form-footer">
          {#if remultKitDataAuth.ui.providers.password.paths.forgot_password}
            <Link href={remultKitDataAuth.ui.providers.password.paths.forgot_password}>
              {remultKitDataAuth.ui.providers.password.dico.forgot_password}
            </Link>
          {/if}
          <hr />
          {#if remultKitDataAuth.ui.providers.password.paths.sign_up}
            <Link href={remultKitDataAuth.ui.providers.password.paths.sign_up}>
              {remultKitDataAuth.ui.providers.password.dico.btn_sign_up}
            </Link>
          {/if}
        </div>
      </Route>

      <Route path={remultKitDataAuth.ui.providers.password.paths.forgot_password}>
        <ForgotPassword {remultKitDataAuth} />

        <div class="form-footer">
          {#if remultKitDataAuth.ui.providers.password.paths.sign_in}
            <Link href={remultKitDataAuth.ui.providers.password.paths.sign_in}>
              {remultKitDataAuth.ui.providers.password.dico.back_to_sign_in}
            </Link>
          {/if}
        </div>
      </Route>

      <Route path={remultKitDataAuth.ui.providers.password.paths.reset_password}>
        <ResetPassword {remultKitDataAuth} />

        <div class="form-footer">
          {#if remultKitDataAuth.ui.providers.password.paths.sign_in}
            <Link href={remultKitDataAuth.ui.providers.password.paths.sign_in}>
              {remultKitDataAuth.ui.providers.password.dico.back_to_sign_in}
            </Link>
          {/if}
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
