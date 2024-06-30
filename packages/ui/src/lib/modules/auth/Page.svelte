<script lang="ts">
  import { Link, Route } from 'svelte-micro'

  import type { firstlyData } from '../../../../../firstly/src/lib/auth/types'
  import ForgotPassword from './components/ForgotPassword.svelte'
  import ResetPassword from './components/ResetPassword.svelte'
  import SignIn from './components/SignIn.svelte'
  import SignUp from './components/SignUp.svelte'

  export let firstlyData: firstlyData
  let firstlyDataAuth = firstlyData.props

  let email = ''
</script>

<div class="wrapper">
  <div class="form">
    <Route>
      {#if firstlyDataAuth.ui.providers.password.paths.sign_up}
        <Route path={firstlyDataAuth.ui.providers.password.paths.sign_up}>
          <SignUp {firstlyDataAuth} bind:email />

          <div class="form-footer">
            {#if firstlyDataAuth.ui.providers.password.paths.sign_in}
              <Link href={firstlyDataAuth.ui.providers.password.paths.sign_in}>
                {firstlyDataAuth.ui.providers.password.dico.back_to_sign_in}
              </Link>
            {/if}
          </div>
        </Route>
      {/if}

      <Route path={firstlyDataAuth.ui.providers.password.paths.sign_in}>
        <SignIn {firstlyDataAuth} bind:email />

        <div class="form-footer">
          {#if firstlyDataAuth.ui.providers.password.paths.forgot_password}
            <Link href={firstlyDataAuth.ui.providers.password.paths.forgot_password}>
              {firstlyDataAuth.ui.providers.password.dico.forgot_password}
            </Link>
          {/if}
          <hr />
          {#if firstlyDataAuth.ui.providers.password.paths.sign_up}
            <Link href={firstlyDataAuth.ui.providers.password.paths.sign_up}>
              {firstlyDataAuth.ui.providers.password.dico.btn_sign_up}
            </Link>
          {/if}
        </div>
      </Route>

      <Route path={firstlyDataAuth.ui.providers.password.paths.forgot_password}>
        <ForgotPassword {firstlyDataAuth} bind:email />

        <div class="form-footer">
          {#if firstlyDataAuth.ui.providers.password.paths.sign_in}
            <Link href={firstlyDataAuth.ui.providers.password.paths.sign_in}>
              {firstlyDataAuth.ui.providers.password.dico.back_to_sign_in}
            </Link>
          {/if}
        </div>
      </Route>

      <Route path={firstlyDataAuth.ui.providers.password.paths.reset_password}>
        <ResetPassword {firstlyDataAuth} />

        <div class="form-footer">
          {#if firstlyDataAuth.ui.providers.password.paths.sign_in}
            <Link href={firstlyDataAuth.ui.providers.password.paths.sign_in}>
              {firstlyDataAuth.ui.providers.password.dico.back_to_sign_in}
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
