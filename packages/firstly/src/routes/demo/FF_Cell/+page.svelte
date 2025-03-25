<script lang="ts">
	import { Task } from '$modules/task/Task'
	import type { CellMetadata } from '$lib/svelte/customField'

	import { FF_Cell, FF_Repo, overwriteOptions } from './../../../lib/svelte'

	const r = new FF_Repo(Task)

	const cell: CellMetadata<unknown, Task> = {
		caption: 'Add a Task',
		type: 'form',
		cells: [
			{
				caption: 'left',
				ui: { style: { width: 75 } },
				// type: "form",
				cells: [
					{ caption: 'Title', ui: { style: { width: 50 } } },
					{ caption: 'Size', ui: { style: { width: 50 } } },
					{ caption: 'Age' },
				],
			},
			{
				caption: 'right',
				ui: { style: { width: 25 } },
				cells: [{ caption: 'second part' }],
			},
		],
	}

	const cell2: CellMetadata<unknown, Task> = {
		caption: 'Add a Task',
		type: 'form',
		cells: [
			{ field: r.fields.title },
			{ field: overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.completed, { ui: { style: { width: 25 } } }) },
			{ field: overwriteOptions(r.fields.typeOfTask, {}) },
			{
				field: overwriteOptions(r.fields.completed, {
					ui: {
						style: { width: 25, widthLeft: 75, mobile: { width: 25, widthLeft: 75 } },
						hint: 'Yeah, try checking this!',
					},
				}),
			},
		],
	}
</script>

<div class="flex flex-col gap-2">
	<FF_Cell {cell} {r} />

	<div class="divider"></div>

	<FF_Cell cell={cell2} {r} />
</div>
