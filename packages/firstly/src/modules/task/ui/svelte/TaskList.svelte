<script lang="ts">
	import { repo } from 'remult'

	import { Task } from '$modules/task/client/Task'

	let list: Task[] = $state([])

	$effect(() => {
		return repo(Task)
			.liveQuery()
			.subscribe((info) => {
				list = info.applyChanges(list)
			})
	})
</script>

<ul>
	{#each list as task (task.id)}
		<li>{task.title}</li>
	{/each}
</ul>
