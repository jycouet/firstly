<script lang="ts">
	import { repo } from 'remult'

	import { queryRepo } from '#lib/svelte/query/index.svelte.js'
	import { ApiItem } from '#modules/demo/ApiItem.js'
	import { Task } from '#modules/demo/Task.js'

	const title = 'queryRepo demo'

	let items = $derived(await queryRepo(ApiItem).find())
	let tasks = $derived(await queryRepo(Task).find({ where: { title } }))
</script>

<h1 class="text-xl font-semibold">queryRepo</h1>
<p class="text-sm text-muted-foreground">
	<code>$derived(await queryRepo(E).find())</code> through the API gate, refreshed by plain
	<code>repo(E)</code> writes.
</p>

<ul class="mt-4 list-disc pl-6">
	{#each items as item (item.id)}
		<li data-item>{item.title}</li>
	{/each}
</ul>
<p class="mt-2 text-sm">
	tasks = <strong data-count>{tasks.length}</strong>
</p>
<button data-add onclick={() => repo(Task).insert({ title })}>add</button>
<button data-delete onclick={() => repo(Task).delete(tasks[0].id)}>delete</button>
