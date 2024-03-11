<script lang="ts">
    import ForgottenPassword from "./components/ForgottenPassword.svelte";
    import Login from "./components/Login.svelte";
    import Pin from "./components/Pin.svelte";

    let view = 'login';
</script>

<div class="wrapper">
    <div class="form">
        <svelte:component this={view === 'login' ? Login : view === 'forgottenPassword' ? ForgottenPassword : Pin} />
    </div>

    <div class="actions">
        <button on:click={() => view = 'forgottenPassword'}>Forgot your password?</button>
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