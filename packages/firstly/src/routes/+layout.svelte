<script lang="ts">
	import { remult } from 'remult'

	import { page } from '$app/stores'

	import { route } from '$modules/ROUTES'

	import '../app.css'

	import { initRemultSvelteReactivity } from 'firstly/svelte'
	import { Button } from '$lib/svelte/ui/button'
	import { Input } from '$lib/svelte/ui/input'
	import { cn } from '$lib/utils'

	import type { LayoutData } from './$types'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet
	}

	let { children, data }: Props = $props()
	remult.user = data.user

	let sidebarOpen = $state(false)

	const links: { path: string; text: string; target?: string }[] = [
		{ path: route('/'), text: 'Home' },
		{ path: route('/boutique-auth'), text: 'Boutique Auth' },

		{ path: route('remult_admin'), text: 'Remult Admin', target: '_blank' },
		{
			path: route('github', { owner: 'remult', repo: 'remult' }),
			text: 'remult',
			target: '_blank',
		},
		{ path: route('github'), text: 'firstly', target: '_blank' },
	]

	const currentLink = $derived(links.find((c) => c.path === $page.url.pathname))

	initRemultSvelteReactivity()
</script>

<svelte:head>
	<title>Firstly</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<!-- Sidebar (desktop) + drawer (mobile) -->
	<aside
		class={cn(
			'fixed inset-y-0 left-0 z-20 flex w-72 flex-col gap-2 overflow-y-auto border-r border-border bg-card px-6 py-10 transition-transform lg:translate-x-0',
			sidebarOpen ? 'translate-x-0' : '-translate-x-full',
		)}
	>
		<div class="mx-2 mb-4 flex items-center gap-2 font-black">
			<svg
				width="28"
				height="28"
				viewBox="0 0 1024 1024"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<rect x="256" y="670.72" width="512" height="256" rx="128" class="fill-foreground" />
				<circle cx="512" cy="353.28" r="256" class="fill-foreground" />
				<circle cx="512" cy="353.28" r="114.688" class="fill-card" />
			</svg>
			Firstly
		</div>
		<nav class="flex flex-col gap-1">
			{#each links as link}
				<a
					href={link.path}
					target={link?.target}
					onclick={() => (sidebarOpen = false)}
					class={cn(
						'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
						link.path === $page.url.pathname && 'bg-accent text-accent-foreground font-medium',
					)}
				>
					{link.text}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Mobile backdrop -->
	{#if sidebarOpen}
		<button
			aria-label="Close sidebar"
			class="fixed inset-0 z-10 bg-black/40 lg:hidden"
			onclick={() => (sidebarOpen = false)}
		></button>
	{/if}

	<!-- Main -->
	<main class="lg:pl-72">
		<header class="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
			<Button variant="ghost" size="icon" class="lg:hidden" onclick={() => (sidebarOpen = true)}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
					<path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zM2 14.75a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
				</svg>
			</Button>
			<h1 class="grow truncate text-lg font-semibold lg:text-2xl lg:font-light">
				{currentLink?.text ?? $page.url.pathname.replace('/', '')}
			</h1>
			<Input type="text" placeholder="Search" class="max-w-48" />
			<div class="flex items-center gap-2">
				{#if !remult.authenticated()}
					<span class="size-9 rounded-full bg-destructive" aria-label="Not authenticated"></span>
				{:else}
					<img
						src="https://avatars.githubusercontent.com/u/5312607?v=4"
						alt="avatar"
						class="size-9 rounded-full"
					/>
				{/if}
			</div>
		</header>

		<div class="p-4 lg:p-8">
			{@render children?.()}
		</div>
	</main>
</div>
