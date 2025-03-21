<script lang="ts">
	import { Task } from '$modules/task/Task'
	import { FF_Form, FF_Grid, FF_Repo, overwriteOptions } from '$lib/svelte'

	const r = new FF_Repo(Task, {
		queryOptions: {
			// skipAutoFetch: true,
			pageSize: 2,
			aggregate: {
				distinctCount: ['title', 'id'],
			},
		},
	})

	// Set up fields with different widths
	const fields = [
		overwriteOptions(r.fields.title, {
			ui: {
				position: {
					span: 4,
					start: 2,
					mobile: { span: 3 },
				},
			},
		}),
		overwriteOptions(r.fields.typeOfTask, { ui: { position: { span: 2, mobile: { span: 12 } } } }),
	]

	function handleEdit(item: Task) {
		console.info('Edit task:', item)
		// Handle edit functionality
	}

	function handleDelete(item: Task) {
		console.info('Delete task:', item)
		// Handle delete functionality
	}
</script>

<div class="flex flex-col gap-2">
	<h2 class="text-2xl">Form with defined fields</h2>
	<FF_Form {r} {fields}></FF_Form>
	<hr />
	<h2 class="text-2xl">Default Grid (Edit and Delete)</h2>
	<FF_Grid {r} />
	<hr />
	<h2 class="text-2xl">Edit Only</h2>
	<FF_Grid {r} showDelete={false} onedit={handleEdit} />
	<hr />
	<h2 class="text-2xl">Delete Only</h2>
	<FF_Grid {r} showEdit={false} ondelete={handleDelete} />
	<hr />
	<h2 class="text-2xl">No Actions</h2>
	<FF_Grid {r} showEdit={false} showDelete={false} showCreate={false} />
</div>

<!-- <style>
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
			grid-column-end: var(--ff-field-position-end);
			grid-column: span var(--ff-field-position-span) / span var(--ff-field-position-span);
			grid-column-start: var(--ff-field-position-start);
		}

		@media (max-width: 768px) {
			[data-ff-field] {
				grid-column-end: var(--ff-field-position-mobile-end);
				grid-column: span var(--ff-field-position-mobile-span) / span
					var(--ff-field-position-mobile-span);
				grid-column-start: var(--ff-field-position-mobile-start);
			}
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

		/* Styles for disabled action buttons in FGrid */
		[data-ff-grid-action-edit]:disabled,
		[data-ff-grid-action-delete]:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			pointer-events: all;
		}

		[data-ff-grid-action-edit]:not(:disabled),
		[data-ff-grid-action-delete]:not(:disabled) {
			cursor: pointer;
		}
	} 
</style>
-->
