<script lang="ts">
	import { Task } from '$modules/task/Task'
	import { FF_Layout, FF_Repo, overwriteOptions } from '$lib/svelte'

	const r = new FF_Repo(Task)

	const fields_Part1 = [
		overwriteOptions(r.fields.title, { ui: { style: { span: 3 } } }),
		overwriteOptions(r.fields.typeOfTask, { ui: {} }),
		overwriteOptions(r.fields.size, { ui: {} }),
	]

	const fields_Part2 = [overwriteOptions(r.fields.completed, { ui: {} })]

	const grouping = [
		{ key: 'part1', class: 'col-span-3', caption: 'Part1', fields: fields_Part1 },
		{ key: 'part2', caption: 'Part2', fields: fields_Part2 },
	]
</script>

<div class="flex flex-col gap-4">
	<FF_Layout {r} {grouping} type="columns"></FF_Layout>

	<div class="divider"></div>

	<FF_Layout {r} {grouping} type="tabs"></FF_Layout>

	<div class="divider"></div>

	<FF_Layout {r} {grouping} type="accordions"></FF_Layout>
</div>
