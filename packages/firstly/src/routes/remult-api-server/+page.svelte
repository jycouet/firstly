<script lang="ts">
	let { data } = $props()
</script>

<h1 class="text-xl font-semibold">remultApiServerLoad</h1>
<p class="text-muted-foreground text-sm">
	A <code>+page.server.ts</code> whose <code>repo(ApiItem)</code> read is wrapped to pass the API
	gate (only <code>pub</code> rows), instead of the privileged in-process provider that would see all.
</p>

<ul class="mt-4 list-disc pl-6">
	{#each data.items as item (item.id)}
		<li data-item>{item.title}</li>
	{/each}
</ul>
<p class="mt-2 text-sm">
	count = <strong data-count>{data.items.length}</strong>
	(1 of 2 seeded rows; an unwrapped server read would see 2)
</p>
