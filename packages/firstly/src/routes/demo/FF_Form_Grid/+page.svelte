<script lang="ts">
	import { Task } from '$modules/task/Task'

	import { FF_Form, FF_Grid, FF_Repo, overwriteOptions } from '../../../lib/svelte'

	const r = new FF_Repo(Task, {
		queryOptions: {
			// skipAutoFetch: true,
			pageSize: 2,
			aggregate: {
				distinctCount: ['title', 'id'],
			},
		},
	})

	// Set up fields with different widths that will fit in one row (4 columns grid)
	const fields = [
		overwriteOptions(r.fields.title, {
			ui: { width: 50, marginLeft: 25, marginRight: 25 },
		}),
		overwriteOptions(r.fields.title, { ui: { width: 50 } }),
		overwriteOptions(r.fields.title, { ui: { width: 25 } }),
		overwriteOptions(r.fields.title, { ui: { width: 25 } }),
		r.fields.typeOfTask,
		overwriteOptions(r.fields.completed, { ui: { width: 25, marginLeft: 50 } }),
		overwriteOptions(r.fields.completed, {
			ui: {
				width: 25,
				marginLeft: 75,
				mobile: { width: 25, marginLeft: 75 },
				hint: 'Yeah, try checking this!',
			},
		}),
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
	<FF_Form {r} groups={[{ key: 'default', fields }]}></FF_Form>
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
