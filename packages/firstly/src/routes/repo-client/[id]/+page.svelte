<script lang="ts">
	import { Task } from '$modules/demo/Task'
	import { repoClient } from '$lib/svelte'

	let { params } = $props()
	let task = $derived(await repoClient(Task).findId(params.id))
	let others = $derived(await repoClient(Task).find({ limit: 5 }))
</script>

<h2 data-detail>{task?.title}</h2>
{#each others as other (other.id)}
	<a data-other href="/repo-client/{other.id}">{other.title}</a>
{/each}
