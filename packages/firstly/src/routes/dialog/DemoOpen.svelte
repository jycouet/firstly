<script lang="ts">
	import { untrack } from 'svelte'
	import type { DialogClose } from 'firstly/svelte'

	let { name, close }: { name: string; close: DialogClose<{ name: string }> } = $props()
	let value = $state(untrack(() => name))
</script>

<h2 class="mb-3 text-lg font-semibold">Custom dialog (open)</h2>
<p class="text-muted-foreground mb-3 text-sm">
	<code>open(Component, &#123; props &#125;)</code> renders a component and infers the result type from
	its <code>close</code> prop.
</p>
<input
	bind:value
	placeholder="Type a name"
	class="border-border bg-card mb-4 w-full rounded-md border px-3 py-2 text-sm"
/>
<div class="flex justify-end">
	<button
		class="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm"
		onclick={() => close({ ok: true, data: { name: value } })}
	>
		OK
	</button>
</div>
