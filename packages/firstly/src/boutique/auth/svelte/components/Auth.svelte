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
		{#if messageError}
			<div
				class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{messageError}
			</div>
		{/if}
		<Input type="text" bind:value={name} placeholder="Name" />
		<Input type="email" bind:value={email} placeholder="Email" />
		<Input type="password" bind:value={password} placeholder="Password" />
		<div class="flex flex-wrap gap-2">
			<Button
				onclick={async () => {
					const res = await authClient.signUp.email({ name, email, password })
					messageError = res.error?.message ?? ''
					remult.initUser()
				}}
			>
				Sign Up
			</Button>
			<Button
				variant="secondary"
				onclick={async () => {
					await authClient.signIn.email({ email, password })
					remult.initUser()
				}}
			>
				Sign In
			</Button>
			<Button variant="link" href="https://better-auth.com" target="_blank">Better-Auth Docs</Button>
		</div>
	{/if}
</Tile>
