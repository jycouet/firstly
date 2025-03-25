<script lang="ts">
	import { Task } from '$modules/task/Task'

	import { FF_Layout, FF_Repo, overwriteOptions } from '../../../lib/svelte'

	const r = new FF_Repo(Task)

	const groups = [
		{
			key: 'part1',
			caption: 'ONE',
			hint: 'This is part 1',
			fields: [
				overwriteOptions(r.fields.title, { ui: { style: { width: 25 } } }),
				overwriteOptions(r.fields.typeOfTask, { ui: {} }),
				overwriteOptions(r.fields.size, { ui: {} }),
			],
		},
		{
			key: 'part2',
			caption: 'TWO',
			hint: 'This is part 2',
			fields: [
				// overwriteOptions(r.fields.createdAt, { ui: { style: {} } }),
				overwriteOptions(r.fields.completed, { ui: {} }),
			],
		},
	]
</script>

<div class="flex flex-col gap-4">
	<FF_Layout {r} layout={{ type: 'detail', key: 'default', groups }} classes_goups="flex" />

	<div class="divider"></div>

	<FF_Layout {r} layout={{ type: 'tab', key: 'default', groups }} />

	<div class="divider"></div>

	<FF_Layout {r} layout={{ type: 'accordion', key: 'default', groups }} />
</div>
