<script lang="ts">
	import { onMount } from 'svelte'

	import { FeedbackController } from '../../feedback/FeedbackController'
	import { Button, dialog, Loading, type ResolvedType } from '../../internals'
	import DialogIssues from './DialogIssues.svelte'

	export let dialogId: number
	const rmvWarning = dialogId

	let state: 'loading' | 'done' = 'loading'

	let milestones: ResolvedType<ReturnType<typeof FeedbackController.getMilestones>> = []
	onMount(async () => {
		milestones = await FeedbackController.getMilestones()
		state = 'done'
	})
</script>

<div class="mb-4 grid gap-4">
	{#each milestones as milestone}
		<Button
			on:click={() =>
				dialog.show({
					component: DialogIssues,
					classes: { root: 'overflow-auto w-[85vh] h-[85vh]' },
					props: { milestoneNumber: milestone.number, milestoneId: milestone.id },
					detail: { caption: milestone.title },
				})}
			class="btn-neutral"
		>
			{milestone.title}
		</Button>
	{:else}
		{#if state === 'loading'}
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
		{:else}
			<p>No milestones found / Filter too strict!</p>
		{/if}
	{/each}
</div>
