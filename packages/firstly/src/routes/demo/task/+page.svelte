<script lang="ts">
	import { Task } from '$modules/task/Task'
	import TaskAdd from '$modules/task/ui/TaskAdd.svelte'
	import TaskList from '$modules/task/ui/TaskList.svelte'
	import { FF_Repo, FForm, FGrid } from '$lib/svelte'

	const r = new FF_Repo(Task, { findOptions: {} })

	// Set up fields with different widths
	const fields = [
		{
			...r.repo.fields.title,
			options: {
				...r.repo.fields.title.options,
				ui: {
					...r.repo.fields.title.options.ui,
					position: { span: 8, start: 3 },
				},
			},
		},
		{ ...r.repo.fields.title, options: { ...r.repo.fields.title.options } },
		{
			...r.repo.fields.typeOfTask,
			options: { ...r.repo.fields.typeOfTask.options, ui: { position: { span: 3 } } },
		},
		{
			...r.repo.fields.typeOfTask,
			options: { ...r.repo.fields.typeOfTask.options, ui: { position: { span: 3 } } },
		},
		{
			...r.repo.fields.typeOfTask,
			options: { ...r.repo.fields.typeOfTask.options, ui: { position: { span: 3 } } },
		},
	]
</script>

<h1>Task Module</h1>

<TaskAdd />
<TaskList />

<hr />

Next level!

<FForm {r} {fields}>
	<!-- {#snippet customField(field, value)}
		{#if field.key === 'title'}
			title stuff... 
		{/if}
	{/snippet} -->
</FForm>

<FGrid {r} />

<style>
	:root {
		--bg-base: gray;
	}

	:global {
		[data-ff-form-fields] {
			display: grid;
			grid-template-columns: repeat(12, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-ff-field] {
			grid-column-start: var(--ff-field-position-start);
			grid-column: span var(--ff-field-position-span, 12);
		}

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
