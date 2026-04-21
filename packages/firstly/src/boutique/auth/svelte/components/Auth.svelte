<script lang="ts">
	import { createAuthClient } from 'better-auth/svelte'

	import { remult } from 'remult'
	import { Button } from 'firstly/svelte/ui/button'
	import { Input } from 'firstly/svelte/ui/input'

	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	import Tile from '../Tile.svelte'

	type Mode = 'signin' | 'signup' | 'forgot' | 'reset'

	const authClient = createAuthClient({
		// you can pass client configuration here
	})

	const token = $derived($page.url.searchParams.get('token'))

	let mode = $state<Mode>($page.url.searchParams.get('token') ? 'reset' : 'signin')

	let name = $state('')
	let email = $state('')
	let password = $state('')
	let newPassword = $state('')
	let confirmPassword = $state('')

	let messageError = $state('')
	let messageSuccess = $state('')
	let submitting = $state(false)

	const titles: Record<Mode, string> = {
		signin: 'Sign in',
		signup: 'Create account',
		forgot: 'Forgot password',
		reset: 'Reset your password',
	}

	function switchMode(next: Mode) {
		mode = next
		password = ''
		newPassword = ''
		confirmPassword = ''
		messageError = ''
		messageSuccess = ''
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		messageError = ''
		messageSuccess = ''
		submitting = true
		try {
			if (mode === 'signin') {
				const res = await authClient.signIn.email({ email, password })
				if (res.error) messageError = res.error.message ?? 'Sign in failed.'
				else remult.initUser()
			} else if (mode === 'signup') {
				const res = await authClient.signUp.email({ name, email, password })
				if (res.error) messageError = res.error.message ?? 'Sign up failed.'
				else remult.initUser()
			} else if (mode === 'forgot') {
				const res = await authClient.requestPasswordReset({
					email,
					redirectTo: `${window.location.origin}/auth`,
				})
				if (res.error) messageError = res.error.message ?? 'Could not send reset email.'
				else messageSuccess = `If an account exists for ${email}, a reset link is on its way.`
			} else if (mode === 'reset') {
				if (!token) {
					messageError = 'Missing or invalid reset token. Request a new reset email.'
					return
				}
				if (newPassword !== confirmPassword) {
					messageError = "Passwords don't match."
					return
				}
				const res = await authClient.resetPassword({ newPassword, token })
				if (res.error) {
					messageError = res.error.message ?? 'Could not reset password.'
				} else {
					messageSuccess = 'Password updated. Redirecting to sign in…'
					setTimeout(() => {
						switchMode('signin')
						goto('/auth')
					}, 1200)
				}
			}
		} finally {
			submitting = false
		}
	}
</script>

<Tile title={titles[mode]} width="half">
	{#if remult.authenticated()}
		{@const roles = remult.user?.roles ?? []}
		<p class="text-sm">
			You are authenticated as <strong>{remult.user?.name}</strong>
			<br />
			<span class="text-muted-foreground italic">Roles:</span>
			{roles.length > 0 ? roles.join(', ') : '-'}
		</p>
		<div class="flex gap-2">
			<Button
				variant="outline"
				onclick={async () => {
					await authClient.signOut()
					remult.user = undefined
				}}
			>
				Sign Out
			</Button>
		</div>
	{:else}
		{#if mode === 'signin' || mode === 'signup'}
			<div class="flex gap-1 rounded-md border border-border p-1 text-sm">
				<button
					type="button"
					class="flex-1 rounded px-3 py-1 transition-colors {mode === 'signin'
						? 'bg-primary text-primary-foreground'
						: 'hover:bg-accent hover:text-accent-foreground'}"
					onclick={() => switchMode('signin')}
				>
					Sign In
				</button>
				<button
					type="button"
					class="flex-1 rounded px-3 py-1 transition-colors {mode === 'signup'
						? 'bg-primary text-primary-foreground'
						: 'hover:bg-accent hover:text-accent-foreground'}"
					onclick={() => switchMode('signup')}
				>
					Sign Up
				</button>
			</div>
		{/if}

		<form class="flex flex-col gap-3" onsubmit={handleSubmit}>
			{#if messageError}
				<div
					class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{messageError}
				</div>
			{/if}
			{#if messageSuccess}
				<div
					class="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
				>
					{messageSuccess}
				</div>
			{/if}

			{#if mode === 'signup'}
				<Input type="text" bind:value={name} placeholder="Name" autocomplete="name" required />
			{/if}

			{#if mode === 'signin' || mode === 'signup' || mode === 'forgot'}
				<Input type="email" bind:value={email} placeholder="Email" autocomplete="email" required />
			{/if}

			{#if mode === 'signin' || mode === 'signup'}
				<Input
					type="password"
					bind:value={password}
					placeholder="Password"
					autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
					minlength={8}
					required
				/>
			{/if}

			{#if mode === 'reset'}
				<Input
					type="password"
					bind:value={newPassword}
					placeholder="New password"
					autocomplete="new-password"
					minlength={8}
					required
				/>
				<Input
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm new password"
					autocomplete="new-password"
					minlength={8}
					required
				/>
			{/if}

			<div class="flex flex-wrap items-center gap-2">
				<Button type="submit" disabled={submitting}>
					{#if mode === 'signin'}Sign In{:else if mode === 'signup'}Create account{:else if mode === 'forgot'}Send
						reset link{:else}Update password{/if}
				</Button>
				{#if mode === 'signin'}
					<Button type="button" variant="link" onclick={() => switchMode('forgot')} class="ml-auto">
						Forgot password?
					</Button>
				{:else if mode === 'forgot' || mode === 'reset'}
					<Button
						type="button"
						variant="link"
						onclick={() => {
							const wasReset = mode === 'reset'
							switchMode('signin')
							if (wasReset) goto('/auth')
						}}
					>
						Back to sign in
					</Button>
				{/if}
			</div>
		</form>
	{/if}
</Tile>
