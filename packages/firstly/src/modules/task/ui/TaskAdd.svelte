<script lang="ts">
	import { EntityError, repo } from 'remult'

	import { Task } from '$modules/task/Task'

	let task = $state(repo(Task).create())
	let error = $state<EntityError<Task> | null>(null)

	const add = async (e: Event) => {
		e.preventDefault()
		try {
			await repo(Task).insert(task)
			task = repo(Task).create()
		} catch (e) {
			if (e instanceof EntityError) {
				error = e
			}
		}
	}
</script>

<form onsubmit={add}>
	<p>
		{error?.modelState?.title}
	</p>
	<label for={repo(Task).fields.title.key}>{repo(Task).fields.title.caption}</label>
	<input id={repo(Task).fields.title.key} type="text" bind:value={task.title} />
	<button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button>
</form>
