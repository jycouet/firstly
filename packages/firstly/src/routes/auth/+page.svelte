<script lang="ts">
	import { remult } from 'remult'

	import { invalidateAll } from '$app/navigation'

	import { AuthController } from '$lib/auth'
	import { isError } from '$lib/internals'
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
			const res = await AuthController.signUpPassword(indentifier, password)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.signInPassword(indentifier, password)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.signOut()
			remult.user = res.user
			msgSuccess = res.message
			await invalidateAll()
		} catch (error) {
			if (isError(error)) {
				msgError = error.message ?? ''
			}
		}
	}

	async function invite() {
		msgError = ''
		msgSuccess = ''
		try {
			const res = await AuthController.invite(indentifier)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.forgotPassword(indentifier)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.resetPassword(token, rPassword)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.signInDemo(username)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.signInOTP(indentifierOtp)
			remult.user = res.user
			msgSuccess = res.message
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
			const res = await AuthController.verifyOtp(indentifierOtp, otp)
			remult.user = res.user
			msgSuccess = res.message
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
	<div class="col-span-4 divider">Message</div>
	<!-- <div>
		<select bind:value={authType}>
			{#each authTypes as auth}
				<option value={auth.id}>{auth.caption}</option>
			{/each}
		</select>
	</div> -->
	<div class="col-span-4 text-right">
		{#if msgError}
			<p class="text-error" data-testid="msg-error">{msgError}</p>
		{:else if msgSuccess}
			<p class="text-primary" data-testid="msg-success">{msgSuccess}</p>
		{:else}
			&nbsp;
		{/if}
	</div>

	<!-- Demo -->
	<!-- {#if authType === AuthProvider.DEMO.id} -->
	<div class="col-span-4 divider">Demo</div>
	<Button onclick={() => signInDemo('Noam')}>Noam</Button>
	<Button onclick={() => signInDemo('Ermin')}>Ermin</Button>
	<Button onclick={() => signInDemo('JYC')}>JYC</Button>
	<Button onclick={() => signInDemo('JYC2')}>JYC2</Button>
	<!-- {/if} -->

	<!-- Password -->
	<!-- {#if authType === AuthProvider.PASSWORD.id} -->
	<div class="col-span-4 divider">Password</div>
	<input class="input" type="text" placeholder="email" bind:value={indentifier} />
	<input class="input" type="password" placeholder="password" bind:value={password} />

	<Button onclick={signUp}>SignUp</Button>
	<Button onclick={signIn}>SignIn</Button>
	<Button onclick={invite}>Invite</Button>
	<div></div>
	<div></div>
	<Button onclick={forgotPassword}>Forgot Password</Button>
	<input class="input" type="text" placeholder="token" bind:value={token} />
	<input class="input" type="password" placeholder="resetPassword" bind:value={rPassword} />
	<div></div>
	<Button onclick={resetPassword}>Reset Password</Button>
	<!-- {/if} -->

	<!-- OTP -->
	<!-- {#if authType === AuthProvider.OTP.id} -->
	<div class="col-span-4 divider">OTP</div>
	<input class="input" type="text" placeholder="email" bind:value={indentifierOtp} />
	<div></div>
	<div></div>
	<Button onclick={sendOtp}>Send OTP</Button>

	<input class="input" type="text" placeholder="OTP" bind:value={otp} />
	<div></div>
	<div></div>
	<Button onclick={verifyOtp}>Verify</Button>
	<!-- {/if} -->

	<!-- {#if authType === AuthProvider.OAUTH.id} -->
	<!-- OAuth -->
	<div class="col-span-4 divider">OAuth</div>
	<div></div>
	<div></div>
	<Button onclick={() => signInOAuth('github')}>GitHub</Button>
	<Button onclick={() => signInOAuth('strava')}>Strava</Button>
	<!-- {/if} -->

	<!-- Logged -->
	<div class="col-span-4 divider">Logged ?</div>
	<pre class="col-span-3" data-testid="msg-info">User: {JSON.stringify(remult.user, null, 2)}</pre>
	<Button class="btn-error" disabled={remult.user === undefined} onclick={signOut}>SignOut</Button>
</div>
