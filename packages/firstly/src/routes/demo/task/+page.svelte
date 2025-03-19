<script lang="ts">
	import { Task } from '$modules/task/Task'
	import TaskAdd from '$modules/task/ui/TaskAdd.svelte'
	import TaskList from '$modules/task/ui/TaskList.svelte'
	import { FF_Repo, FForm, FGrid } from '$lib/svelte'

	// FF_repo
	// FR
	// Repo
	const r = new FF_Repo(Task, { findOptions: {} })

	const fields = [r.repo.fields.title, r.repo.fields.typeOfTask]
</script>

<h1>Task Module</h1>

<TaskAdd />
<TaskList />

<hr />

Next level!

<FForm {r} {fields}></FForm>

<FGrid {r} />

<style>
	:root {
		--bg-base: black;
	}

	:global {
		[data-ff-field-header] {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		[data-ff-form-button] {
			margin-top: 1rem;
		}

		[data-ff-field-error] {
			color: red;
			font-size: 0.8rem;
		}

		input[data-ff-field-input] {
			background-color: var(--bg-base);
			width: 100%;
		}

		select[data-ff-field-select] {
			background-color: var(--bg-base);
			width: 100%;
		}
	}
</style>
