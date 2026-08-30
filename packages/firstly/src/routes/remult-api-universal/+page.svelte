<script lang="ts">
	let { data } = $props()
</script>

<h1 class="text-xl font-semibold">loadRepo</h1>
<p class="text-muted-foreground text-sm">
	A universal <code>+page.ts</code> reading <code>repoClient(ApiItem)</code> through the API gate.
</p>

<ul class="mt-4 list-disc pl-6">
	{#each data.items as item (item.id)}
		<li data-item>{item.title}</li>
	{/each}
</ul>
<p class="mt-2 text-sm">
	count = <strong data-count>{data.items.length}</strong>
	(seeded 2 rows; the private one is filtered by <code>apiPrefilter</code>)
</p>
