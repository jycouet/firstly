<script lang="ts">
	import { Task } from '$modules/task/Task'

	import { FF_Layout, FF_Repo, overwriteOptions } from '../../../../lib/svelte'

	const r = new FF_Repo(Task)

	const groups = [
		{
			key: 'part1',
			// class: 'flex flex-col',
			caption: 'ONE',
			hint: 'This is part 1',
			fields: [
				overwriteOptions(r.fields.title, { ui: { style: { span: 3 } } }),
				overwriteOptions(r.fields.typeOfTask, { ui: {} }),
				overwriteOptions(r.fields.size, { ui: {} }),
			],
		},
		{
			key: 'part2',
			// class: 'flex-shrink',
			caption: 'TWO',
			hint: 'This is part 2',
			fields: [overwriteOptions(r.fields.completed, { ui: {} })],
		},
	]
</script>

<div class="flex flex-col gap-4">
	<FF_Layout {r} {groups} type="columns" classes_goups="flex">
		<!-- classes_columns -->
	</FF_Layout>

	<div class="divider"></div>

	<FF_Layout {r} {groups} type="tabs"></FF_Layout>

	<div class="divider"></div>

	<FF_Layout {r} {groups} type="accordions"></FF_Layout>
</div>
