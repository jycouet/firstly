<script lang="ts">
	import { onMount } from 'svelte'

	import { FeedbackController } from '..'
	import {
		Button,
		dialog,
		Icon,
		LibIcon_Add,
		LibIcon_Check,
		LibIcon_Search,
		Loading,
		type ResolvedType,
	} from '../..'
	import DialogIssue from './DialogIssue.svelte'

	export let dialogId: number
	const rmvWarning = dialogId

	export let milestoneNumber: number
	export let milestoneId: string

	let state: 'loading' | 'done' = 'loading'
	let issueState: 'OPEN' | 'CLOSED' = 'OPEN'

	let issues: ResolvedType<ReturnType<typeof FeedbackController.getIssues>> = []

	const update = async (_issueState: 'OPEN' | 'CLOSED') => {
		issueState = _issueState
		state = 'loading'
		issues = await FeedbackController.getIssues(milestoneNumber, issueState)
		state = 'done'
	}

	onMount(async () => {
		await update(issueState)
	})
</script>

<div class="mb-4 grid gap-4">
	<div class="flex justify-between">
		<div>
			<Button
				class={issueState === 'OPEN' ? 'btn-primary' : 'btn-ghost'}
				on:click={() => update('OPEN')}>En cours</Button
			>
			<Button
				class={issueState === 'CLOSED' ? 'btn-primary' : 'btn-ghost'}
				on:click={() => update('CLOSED')}>Clos</Button
			>
		</div>

		<Button
			on:click={async () => {
				await dialog.show({
					component: DialogIssue,
					classes: { root: 'w-5/6 h-5/6' },
					props: { issueNumber: null, milestoneId },
					detail: {
						caption: 'Nouveau Feedback',
						icon: { data: LibIcon_Search },
					},
				})
				await update(issueState)
			}}
		>
			<Icon data={LibIcon_Add}></Icon>
		</Button>
	</div>

	{#each issues as issue}
		<Button
			on:click={async () => {
				await dialog.show({
					component: DialogIssue,
					classes: { root: 'w-5/6 h-5/6' },
					props: { issueNumber: issue.number, milestoneId },
					detail: {
						caption: issue.titleHTML,
						icon: { data: issue.state === 'OPEN' ? LibIcon_Search : LibIcon_Check },
					},
				})
				await update(issueState)
			}}
			class="btn-neutral"
		>
			<div class="w-full text-left">
				{@html issue.titleHTML}
			</div>
		</Button>
	{:else}
		{#if state === 'loading'}
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
		{:else}
			<p>Nothing here</p>
		{/if}
	{/each}
</div>
