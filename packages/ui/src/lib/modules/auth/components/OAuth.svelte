<script lang="ts">
	import { AuthController } from '../../../../../../firstly/src/lib/auth'
	import type { FirstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'

	interface Props {
		firstlyDataAuth: FirstlyDataAuth
	}

	let { firstlyDataAuth }: Props = $props()

	let providers: { name: string; label: string; url: string; raw_svg?: string }[] = $state([])

	$effect(() => {
		Promise.all(
			(firstlyDataAuth?.providers ?? []).map(async (provider) => {
				return {
					...provider,
					url: await AuthController.signInOAuthGetUrl({
						provider: provider.name,
						redirect: new URL(window.location.href).searchParams.get('redirect') ?? '/',
					}),
				}
			}),
		).then((results) => {
			providers = results
		})
	})
</script>

{#if providers.length !== 0}
	<hr style="margin: 1rem" />
	<div class="oauth-container">
		{#each providers as provider (provider.name)}
			<a href={provider.url} class="oauth-button">
				{#if provider.raw_svg}
					<div class="oauth-button-icon">
						{@html provider.raw_svg}
					</div>
				{/if}
				<span>{provider.label}</span>
			</a>
		{/each}
	</div>
{/if}

<style>
	.oauth-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.oauth-button-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.oauth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		background-color: white;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		text-decoration: none;
	}
</style>
