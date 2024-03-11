<script lang="ts">
  import ForgottenPassword from './components/ForgottenPassword.svelte'
  import Login from './components/Login.svelte'
  import Pin from './components/Pin.svelte'

  export let remultKitData

  let view = 'login'
</script>

<div class="wrapper">
  <div class="form">
    <svelte:component
      this={view === 'login' ? Login : view === 'forgottenPassword' ? ForgottenPassword : Pin}
      {remultKitData}
    />
  </div>

  <div class="actions">
    <button on:click={() => (view = 'forgottenPassword')}
      >Forgot your password? {remultKitData.props.strings['auth.forgotPassword']}</button
    >
  </div>
</div>
{JSON.stringify(remultKitData)}

<style>
  .wrapper {
    max-width: 500px;
    margin: 0 auto;
  }

  .form {
    max-width: 400px;
  }
</style>
