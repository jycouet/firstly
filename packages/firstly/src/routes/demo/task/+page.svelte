<script lang="ts">
	import { Task } from '$modules/task/Task'
	import { FF_Repo, FF_Form, FF_Grid } from '$lib/svelte'
	import { mergeFieldMetadata } from '$lib/svelte/mergeFieldMetadata'

	const r1 = new FF_Repo(Task, { findOptions: {} })
	// const r = new FF_Repo(Task, { })

	const r = new FF_Repo(Task, {
		// findOptions: {

		// },
		queryOptions: {
			// skipAutoFetch: true,
			pageSize: 1,
			aggregate: {
				distinctCount: ['title', 'id'],
			},
		},
	})
	// const tt = async () => {

	// 	const res = await r.query({
	// 		aggregate: {
	// 			max: ['title']
	// 		}
	// 	})
	// 	res.aggregates
	// }
	// $inspect(r.aggregates)
	// $inspect(r.aggregates?.title.distinctCount)
	// $inspect(r.aggregates)
	// $inspect(r.loading)

	// $effect(async () => {
	// 	const p = await rr.paginator({pageSize: 2, aggregate: {}})
	// 	// const tt = await p.paginator()
	// 	// console.log(await tt.count())
	// 	// console.log(tt)

	// })

	// Set up fields with different widths
	const fields = [
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 12 } } }),
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 6, mobile: { span: 12 } } } }),
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 3 } } }),
		// mergeFieldMetadata(r.fields.typeOfTask, { ui: { position: { start: 2, span: 3 } } }),
		// mergeFieldMetadata(r.fields.typeOfTask, { ui: { position: { span: 3 } } }),
	]

	function handleEdit(item: Task) {
		console.log('Edit task:', item)
		// Handle edit functionality
	}

	function handleDelete(item: Task) {
		console.log('Delete task:', item)
		// Handle delete functionality
	}
</script>

<div class="flex flex-col gap-1">
	<!-- <FF_Form {r} {fields}> -->
	<FF_Form {r}>
		<!-- {#snippet customField(field, value)}
		{#if field.key === 'title'}
			title stuff... 
		{/if}
	{/snippet} -->
	</FF_Form>
	<hr />
	<h2 class="text-2xl">Default Grid (Edit and Delete)</h2>
	<FF_Grid {r} />
	<!-- ondelete={handleDelete} -->
	<!-- onedit={handleEdit} -->
	<hr />
	<h2 class="text-2xl">Edit Only</h2>
	<FF_Grid {r} showDelete={false} onedit={handleEdit} />
	<hr />
	<h2 class="text-2xl">Delete Only</h2>
	<FF_Grid {r} showEdit={false}  ondelete={handleDelete} />
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