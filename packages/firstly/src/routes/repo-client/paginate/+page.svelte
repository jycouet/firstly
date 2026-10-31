<script lang="ts">
	import { Task } from '$modules/demo/Task'
	import { repoClient } from '$lib/svelte'

	let page = $derived(await repoClient(Task).query({ pageSize: 2 }).paginator())
	let more = $state<Task[]>([])
	let cursor = $state(page)

	const next = async () => {
		cursor = await cursor.nextPage()
		more = [...more, ...cursor.items]
	}
</script>

{#each [...page.items, ...more] as task (task.id)}
	<p data-task>{task.title}</p>
{/each}
<button data-more disabled={!cursor.hasNextPage} onclick={next}>more</button>
