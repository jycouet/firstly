<script lang="ts">
	import { AuthController } from '../../../../../../firstly/src/lib/auth'
	import type { FirstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
	import { isError } from '../../../../../../firstly/src/lib/internals'
	import { autofocus } from '../helpers'

	export let firstlyDataAuth: FirstlyDataAuth

	export let view = 'login'
	export let email = ''

	let msgError = ''
	let msgSuccess = ''

	let password: string
	// let pincode: number

	let loading = false

	async function signIn() {
		msgError = ''
		msgSuccess = ''
		loading = true
		try {
			await AuthController.signInPassword(email, password)
			window.location.href = new URL(window.location.href).searchParams.get('redirect') ?? '/'
		} catch (error) {
			if (isError(error)) {
				msgError = error.message ?? ''
			}
			loading = false
		}
	}
</script>

{#if view == 'login'}
	<form on:submit|preventDefault={signIn}>
		<p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
		<label>
			{firstlyDataAuth.ui?.strings.email}
			<input
				required
				bind:value={email}
				use:autofocus
				type="email"
				placeholder={firstlyDataAuth.ui?.strings.email_placeholder}
			/>
		</label>
		<label>
			{firstlyDataAuth.ui?.strings.password}
			<input
				required
				bind:value={password}
				type="password"
				placeholder={firstlyDataAuth.ui?.strings.password_placeholder}
			/>
		</label>
		<button disabled={!email || !password || loading}
			>{firstlyDataAuth.ui?.strings.btn_sign_in}</button
		>
	</form>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
	}
</style>
