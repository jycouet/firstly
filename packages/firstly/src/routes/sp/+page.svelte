<script lang="ts">
	import { onMount } from 'svelte'

	import { afterNavigate } from '$app/navigation'

	import { SP } from 'firstly/svelte'

	const sp = new SP({ q: '' })

	let ready = $state(false)
	let search = $state('')

	onMount(() => (ready = true))
	// Runs once Kit has applied its scroll and focus handling.
	afterNavigate(({ to }) => (search = to?.url.search ?? ''))
</script>

<h1 class="text-xl font-semibold">SP</h1>
<p class="text-muted-foreground text-sm">Typing updates the URL, scroll and focus stay put.</p>

<div class="h-[150vh]"></div>
<input
	bind:value={sp.obj.q}
	data-filter={ready}
	aria-label="Filter"
	class="border-input rounded-md border bg-transparent px-3 py-1"
/>
<p class="text-sm">search = <code data-search>{search}</code></p>
<div class="h-[150vh]"></div>
