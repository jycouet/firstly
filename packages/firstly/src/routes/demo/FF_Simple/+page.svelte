<script lang="ts">
	import { Task } from '$modules/task/Task'

	import { FF_Form, FF_Grid, FF_Repo } from '../../../lib/svelte'

	const r = new FF_Repo(Task, {
		queryOptions: { orderBy: { createdAt: 'asc' } },
	})
</script>

<div class="flex flex-col gap-2">
	<h2 class="text-2xl">Default Form</h2>
	<FF_Form {r} />

	<hr />

	<h2 class="text-2xl">Default Grid</h2>
	<FF_Grid {r} />
</div>
