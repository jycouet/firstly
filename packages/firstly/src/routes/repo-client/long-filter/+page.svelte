<script lang="ts">
	import { Task } from '$modules/demo/Task'
	import { repoClient } from '$lib/svelte'

	// Too long for a query string, so remult POSTs the read.
	const ids = Array.from({ length: 300 }, (_, i) => `id-${i}-${'x'.repeat(30)}`)
	let tasks = $derived(await repoClient(Task).find({ where: { id: { $in: ids } } }))
</script>

<p data-count>{tasks.length}</p>
