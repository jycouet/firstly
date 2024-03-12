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
        <input type="text" placeholder="Username or Email" />
        <button>Send Password Reset Link</button>
    </form>
</div>