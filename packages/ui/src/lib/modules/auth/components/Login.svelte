<script lang="ts">
    import { autofocus } from "../helpers";

    import { AuthController } from '../../../../../../remult-kit/src/lib/auth/AuthController.js';
    import { isError } from '../../../../../../remult-kit/src/lib/helper';

    export let remultKitData:any;

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

    export let view = "login";
    export let indentifier = "";

    export let msgError = "";
    export let msgSuccess = "";

    let password: string;
    let pincode: number;

    async function signIn() {
        msgError = ''
        msgSuccess = ''
        try {
            await AuthController.signInPassword(indentifier, password)
        } catch (error) {
            if (isError(error)) {
                msgError = error.message ?? ''
            }
        }
    }
</script>


{#if view == "login"}
<form on:submit|preventDefault={signIn}>
    <p>{msgError}{msgSuccess}</p>
    <label>
        Username
        <input bind:value={indentifier} use:autofocus type="text" />
    </label>
    <label>
        Password
        <input bind:value={password} type="password" />
    </label>
    <button>Login</button>
</form>
{/if}


{#if view == "pin"}
<form on:submit|preventDefault={handlePin}>
    <p>{msgError}{msgSuccess}</p>
    <label>
        PIN
        <input bind:value={pincode} use:autofocus type="number" placeholder="556775" />
    </label>
    <button>Confirm</button>
</form>
{/if}


<style>
    form {
        display: flex;
        flex-direction: column;
    }
</style>