<script lang="ts">
	import { createAuthClient } from 'better-auth/svelte'

	import { remult } from 'remult'

	import { Button } from '$lib/svelte/ui/button'
	import { Input } from '$lib/svelte/ui/input'

	import Tile from '../Tile.svelte'

	const authClient = createAuthClient({
		// you can pass client configuration here
	})

	let name = $state('')
	let email = $state('')
	let password = $state('')

	let messageError = $state('')

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		const action = (e.submitter as HTMLButtonElement | null)?.dataset.action
		messageError = ''
		if (action === 'signup') {
			const res = await authClient.signUp.email({ name, email, password })
			messageError = res.error?.message ?? ''
			if (!res.error) remult.initUser()
		} else if (action === 'signin') {
			const res = await authClient.signIn.email({ email, password })
			messageError = res.error?.message ?? ''
			if (!res.error) remult.initUser()
		}
	}
</script>

<Tile title="Auth" status="Success" subtitle="" className="" width="half">
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
		<p class="text-sm">You are currently not authenticated</p>
		<form class="flex flex-col gap-3" onsubmit={handleSubmit}>
			{#if messageError}
				<div
					class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{messageError}
				</div>
			{/if}
			<Input type="text" bind:value={name} placeholder="Name" autocomplete="name" />
			<Input type="email" bind:value={email} placeholder="Email" autocomplete="email" required />
			<Input
				type="password"
				bind:value={password}
				placeholder="Password"
				autocomplete="current-password"
				required
			/>
			<div class="flex flex-wrap gap-2">
				<Button type="submit" data-action="signup">Sign Up</Button>
				<Button type="submit" variant="secondary" data-action="signin">Sign In</Button>
				<Button variant="link" href="https://better-auth.com" target="_blank">Better-Auth Docs</Button>
			</div>
		</form>
	{/if}
</Tile>
