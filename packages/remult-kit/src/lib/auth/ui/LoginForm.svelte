<script>
    export let remultKitData;

    // Defaults
    $: if (!remultKitData) {
        remultKitData = {
            props: {
                paths: {
                    base: '/kit/auth',
                    login: '/login',
                    forgottenPassword: '/forgotten-password'
                }
            }
        }
    }
</script>

<div class="login">
    <form>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
    </form>
</div>

<style>
    .login form {
        display: flex;
        flex-direction: column;
    }
</style>