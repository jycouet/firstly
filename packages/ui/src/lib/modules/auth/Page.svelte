<script lang="ts">
  import { Route, Link, linkHandle } from "svelte-micro"

  import ForgottenPasswordForm from '../../../../../remult-kit/src/lib/auth/ui/ForgottenPasswordForm.svelte';
  import LoginForm from '../../../../../remult-kit/src/lib/auth/ui/LoginForm.svelte';

  export let remultKitData : any;
</script>


<div class="wrapper">
  <div class="form">
    <Route>
      <Route path={remultKitData.props.paths.base + remultKitData.props.paths.login}>
        <LoginForm {remultKitData} />
      </Route>
      <Route path={remultKitData.props.paths.base + remultKitData.props.paths.forgottenPassword}>
        <ForgottenPasswordForm {remultKitData} />
      </Route>
    </Route>
  </div>

  <div class="actions">

  </div>
</div>



<style>
  .wrapper {
    max-width: 500px;
    margin: 0 auto;
  }

  .form {
    max-width: 400px;
  }
</style>
