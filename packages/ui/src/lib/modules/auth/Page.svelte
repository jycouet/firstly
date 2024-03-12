<script lang="ts">
  import { Route, Link, linkHandle } from "svelte-micro"

  import ForgottenPassword from './components/ForgottenPassword.svelte';
  import Login from './components/Login.svelte';

  export let remultKitData : any;

  $: forgottenPasswordPath = remultKitData.props.paths.base + remultKitData.props.paths.forgottenPassword;
  $: loginPath = remultKitData.props.paths.base + remultKitData.props.paths.login;
</script>


<div class="wrapper">
  <div class="form">
    <Route>
      <Route path={loginPath}>
        <Login {remultKitData} />

        <div class="form-footer">
          <Link href={forgottenPasswordPath}>
            Forgot your password?
          </Link>
        </div>
      </Route>

      <Route path={forgottenPasswordPath}>
        <ForgottenPassword {remultKitData} />

        <div class="form-footer">
          <Link href={loginPath}>
            Back to login
          </Link>
        </div>
      </Route>

      <Route fallback>
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
