<script lang="ts">
	import { ApiItem } from '$modules/demo/ApiItem'
	import { Task } from '$modules/demo/Task'
	import { repoClient } from '$lib/svelte'

	let search = $state('')
	let version = $state(0)
	let title = $state('')

	const findTasks = (_version: number) =>
		repoClient(Task).find({ where: { title: { $contains: search } } })

	let tasks = $derived(await findTasks(version))
	let items = $derived(await repoClient(ApiItem).find())

	const add = async () => {
		await repoClient(Task).insert({ title })
		title = ''
		version++
	}
	const remove = async (task: Task) => {
		await repoClient(Task).delete(task)
		version++
	}
</script>

<p data-count>{items.length}</p>
{#each items as item (item.id)}
	<p data-item>{item.title}</p>
{/each}

<input data-search placeholder="filter" bind:value={search} />
{#if $effect.pending()}<span data-pending>...</span>{/if}

<form
	onsubmit={(e) => {
		e.preventDefault()
		add()
	}}
>
	<input data-title placeholder="new task" bind:value={title} />
	<button data-add>add</button>
</form>

<ul>
	{#each tasks as task (task.id)}
		<li data-task>
			<a href="/repo-client/{task.id}">{task.title}</a>
			<button data-remove onclick={() => remove(task)}>x</button>
		</li>
	{/each}
</ul>
