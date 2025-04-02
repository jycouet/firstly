<script lang="ts">
	import { Task } from '$modules/task/Task'

	import { FF_Layout, FF_Repo } from '../../../../lib/svelte'

	const r = new FF_Repo(Task, { queryOptions: { pageSize: 5 } })
</script>

<div class="flex flex-col gap-4">
	<FF_Layout {r} />
</div>
