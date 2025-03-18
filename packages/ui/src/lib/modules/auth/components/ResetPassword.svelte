<script lang="ts">
	import { isError } from '../../../../../../firstly/src/lib'
	import { AuthController } from '../../../../../../firstly/src/lib/auth'
	import type { FirstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'

	export let firstlyDataAuth: FirstlyDataAuth
	export let password1 = ''
	export let password2 = ''

	let msgError = ''
	let msgSuccess = ''
	let loading = false

	async function reset() {
		msgError = ''
		msgSuccess = ''
		loading = true
		const token = new URL(location.href).searchParams.get('token')
		try {
			const res = await AuthController.resetPassword(token ?? '', password1)
			msgSuccess = res.message ?? ''
			window.location.href = '/'
		} catch (error) {
			if (isError(error)) {
				msgError = error.message ?? ''
			}
			loading = false
		}
	}
</script>

<div class="login">
	<p class="message" class:error={msgError}>{msgError}{msgSuccess}</p>
	<form on:submit|preventDefault={reset}>
		{firstlyDataAuth.ui?.strings.password}
		<input
			bind:value={password1}
			type="password"
			required
			placeholder={firstlyDataAuth.ui?.strings.password_placeholder}
		/>
		{firstlyDataAuth.ui?.strings.confirm}
		<input
			bind:value={password2}
			type="password"
			required
			placeholder={firstlyDataAuth.ui?.strings.password_placeholder}
		/>
		<button disabled={!password1 || !password2 || loading}>{firstlyDataAuth.ui?.strings.reset}</button
		>
	</form>
</div>

<style>
	form {
		display: flex;
		flex-direction: column;
	}
</style>
