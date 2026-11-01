<script lang="ts">
	import { onMount } from 'svelte'

	import { SP } from 'firstly/svelte'

	import { afterNavigate } from '$app/navigation'

	const sp = new SP({ q: '' })

	let ready = $state(false)
	let search = $state('')

	onMount(() => (ready = true))
	// Runs once Kit has applied its scroll and focus handling.
	afterNavigate(({ to }) => (search = to?.url.search ?? ''))
</script>

<h1 class="text-xl font-semibold">SP</h1>
<p class="text-sm text-muted-foreground">Typing updates the URL, scroll and focus stay put.</p>

<div class="h-[150vh]"></div>
<input
	bind:value={sp.obj.q}
	data-filter={ready}
	aria-label="Filter"
	class="rounded-md border border-input bg-transparent px-3 py-1"
/>
<p class="text-sm">search = <code data-search>{search}</code></p>
<div class="h-[150vh]"></div>
