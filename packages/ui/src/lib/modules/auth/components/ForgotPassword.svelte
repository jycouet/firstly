<script lang="ts">
	import { isError } from '../../../../../../firstly/src/lib/internals'
	import { AuthController } from '../../../../../../firstly/src/lib/auth'
	import type { FirstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'
	import { autofocus } from '../helpers'

	export let firstlyDataAuth: FirstlyDataAuth
	export let email = ''

	let msgError = ''
	let msgSuccess = ''
	let loading = false

	async function forgot() {
		msgError = ''
		msgSuccess = ''
		loading = true
		try {
			const res = await AuthController.forgotPassword(email)
			msgSuccess = res.message ?? ''
		} catch (error) {
			if (isError(error)) {
				msgError = error.message ?? ''
			}
			loading = false
		}
	}
</script>

<div class="login">
	<p class="message" class:error={msgError} class:success={msgSuccess}>{msgError}{msgSuccess}</p>
	<form on:submit|preventDefault={forgot}>
		<input
			required
			use:autofocus
			bind:value={email}
			type="email"
			placeholder={firstlyDataAuth.ui?.strings.email_placeholder}
		/>
		<button disabled={!email || !email.includes('@') || !email.includes('.') || loading}
			>{firstlyDataAuth.ui?.strings.send_password_reset_instructions}</button
		>
	</form>
</div>

<style>
	form {
		display: flex;
		flex-direction: column;
	}
</style>
