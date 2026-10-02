<script lang="ts">
	import { remult } from 'remult'
	import { FF_DialogManager, initRemultSvelteReactivity } from 'firstly/svelte'

	import '../app.css'

	let { children, data } = $props()
	// The OAuth session is the user: roles gate the API and the grid's create / edit buttons.
	remult.user = data.user
	initRemultSvelteReactivity()
</script>

<svelte:head>
	<title>firstly x atproto</title>
</svelte:head>

<div class="bg-background text-foreground min-h-screen">
	<main class="mx-auto max-w-5xl px-4 py-8">
		<header class="mb-6 flex items-baseline justify-between">
			<h1 class="text-xl font-semibold">firstly x atproto</h1>
			<nav class="flex gap-4 text-sm">
				<a class="underline" href="https://firstly.fun/docs/atproto" target="_blank">docs</a>
				<a class="underline" href="/api/admin" target="_blank">remult admin</a>
				<a class="underline" href="https://github.com/jycouet/firstly" target="_blank">github</a>
			</nav>
		</header>
		{@render children?.()}
	</main>
</div>

<FF_DialogManager />
