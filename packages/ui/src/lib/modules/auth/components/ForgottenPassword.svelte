<script>
    import { autofocus } from "../helpers";

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