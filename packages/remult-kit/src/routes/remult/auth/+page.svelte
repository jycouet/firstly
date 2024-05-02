<script lang="ts">
  import { remult } from 'remult'

  import { invalidateAll } from '$app/navigation'

  import { isError } from '$lib'
  import { AuthController } from '$lib/auth/AuthController.js'
  import Button from '$lib/ui/Button.svelte'

  let msgError = ''
  let msgSuccess = ''
  let indentifier = 'jycouet@gmail.com'
  let password = 'coucou'
  let token = ''
  let rPassword = ''
  let indentifierOtp = 'jycouet@gmail.com'
  let otp = ''

  async function signUp() {
    msgError = ''
    msgSuccess = ''
    try {
      await AuthController.signUpPassword(indentifier, password)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function signIn() {
    msgError = ''
    msgSuccess = ''
    try {
      await AuthController.signInPassword(indentifier, password)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function signOut() {
    msgError = ''
    msgSuccess = ''
    try {
      await AuthController.signOut()
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function forgotPassword() {
    msgError = ''
    msgSuccess = ''
    try {
      msgSuccess = await AuthController.forgotPassword(indentifier)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function resetPassword() {
    msgError = ''
    msgSuccess = ''
    try {
      msgSuccess = await AuthController.resetPassword(token, rPassword)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function signInDemo(username: string) {
    msgError = ''
    msgSuccess = ''
    try {
      msgSuccess = await AuthController.signInDemo(username)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function sendOtp() {
    msgError = ''
    msgSuccess = ''
    try {
      msgSuccess = await AuthController.signInOTP(indentifierOtp)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function verifyOtp() {
    msgError = ''
    msgSuccess = ''
    try {
      msgSuccess = await AuthController.verifyOtp(otp, indentifierOtp)
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  async function signInOAuth(p: 'github' | 'strava') {
    msgError = ''
    try {
      const url = await AuthController.signInOAuthGetUrl({
        provider: p,
        redirect: window.location.pathname,
        // options: { scopes: p === 'strava' ? ['read'] : [] },
        // redirect: 'www.google.fr',
      })
      // console.log(`url`, url)
      window.location.href = url
      await invalidateAll()
    } catch (error) {
      if (isError(error)) {
        msgError = error.message ?? ''
      }
    }
  }

  // const authTypes = [AuthProvider.DEMO, AuthProvider.PASSWORD, AuthProvider.OTP, AuthProvider.OAUTH]
  // let authType = AuthProvider.PASSWORD.id

  export let data
  $: remult.user = data.user
</script>

<div class="grid grid-cols-4 gap-4">
  <div class="divider col-span-4">Message</div>
  <!-- <div>
		<select bind:value={authType}>
			{#each authTypes as auth}
				<option value={auth.id}>{auth.caption}</option>
			{/each}
		</select>
	</div> -->
  <div class="col-span-4 text-right">
    {#if msgError}
      <p class="text-error">{msgError}</p>
    {:else if msgSuccess}
      <p class="text-primary">{msgSuccess}</p>
    {:else}
      &nbsp;
    {/if}
  </div>

  <!-- Demo -->
  <!-- {#if authType === AuthProvider.DEMO.id} -->
  <div class="divider col-span-4">Demo</div>
  <Button on:click={() => signInDemo('Noam')}>Noam</Button>
  <Button on:click={() => signInDemo('Ermin')}>Ermin</Button>
  <Button on:click={() => signInDemo('JYC')}>JYC</Button>
  <Button on:click={() => signInDemo('JYC2')}>JYC2</Button>
  <!-- {/if} -->

  <!-- Password -->
  <!-- {#if authType === AuthProvider.PASSWORD.id} -->
  <div class="divider col-span-4">Password</div>
  <input class="input input-bordered" type="text" placeholder="email" bind:value={indentifier} />
  <input
    class="input input-bordered"
    type="password"
    placeholder="password"
    bind:value={password}
  />

  <Button on:click={signUp}>SignUp</Button>
  <Button on:click={signIn}>SignIn</Button>
  <div></div>
  <div></div>
  <div></div>
  <Button on:click={forgotPassword}>Forgot Password</Button>
  <input class="input input-bordered" type="text" placeholder="token" bind:value={token} />
  <input
    class="input input-bordered"
    type="password"
    placeholder="resetPassword"
    bind:value={rPassword}
  />
  <div></div>
  <Button on:click={resetPassword}>Reset Password</Button>
  <!-- {/if} -->

  <!-- OTP -->
  <!-- {#if authType === AuthProvider.OTP.id} -->
  <div class="divider col-span-4">OTP</div>
  <input class="input input-bordered" type="text" placeholder="email" bind:value={indentifierOtp} />
  <div></div>
  <div></div>
  <Button on:click={sendOtp}>Send OTP</Button>

  <input class="input input-bordered" type="text" placeholder="OTP" bind:value={otp} />
  <div></div>
  <div></div>
  <Button on:click={verifyOtp}>Verify</Button>
  <!-- {/if} -->

  <!-- {#if authType === AuthProvider.OAUTH.id} -->
  <!-- OAuth -->
  <div class="divider col-span-4">OAuth</div>
  <div></div>
  <div></div>
  <Button on:click={() => signInOAuth('github')}>GitHub</Button>
  <Button on:click={() => signInOAuth('strava')}>Strava</Button>
  <!-- {/if} -->

  <!-- Logged -->
  <div class="divider col-span-4">Logged ?</div>
  <pre class="col-span-3">User: {JSON.stringify(remult.user, null, 2)}</pre>
  <Button class="btn-outline btn-error" disabled={remult.user === undefined} on:click={signOut}
    >SignOut</Button
  >
</div>
