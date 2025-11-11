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
	} from '../../internals'
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
					classes: { root: 'overflow-auto w-[80vh] h-[80vh]' },
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
					classes: { root: 'overflow-auto w-[80vh] h-[80vh]' },
					props: { issueNumber: issue.number, milestoneId },
					detail: {
						caption: '#' + issue.number + ' - ' + issue.titleHTML,
						icon: { data: issue.state === 'OPEN' ? LibIcon_Search : LibIcon_Check },
					},
				})
				await update(issueState)
			}}
			class="btn-neutral"
		>
			<div class="flex w-full justify-center justify-items-center text-left">
				<div class="flex-grow">
					<span class="mr-2 inline-block w-8 text-right text-xs text-base-content/60 italic"
						>#{issue.number}</span
					>
					{@html issue.titleHTML}
				</div>
				{#if issue.highlight}
					<span class="badge badge-warning">En attente de réponse</span>
				{/if}
			</div>
		</Button>
	{:else}
		{#if state === 'loading'}
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
			<Loading class="h-12"></Loading>
		{:else}
			<div class="flex flex-col items-center justify-center p-8 text-center text-gray-500">
				<div class="mb-4">
					<Icon data={LibIcon_Search} size="4rem"></Icon>
				</div>
				<p class="text-lg font-medium">Aucun feedback <b>{issueState}</b> pour le moment</p>
				<p class="mt-2 text-sm">Soyez le premier à donner votre avis sur cette version !</p>
			</div>
		{/if}
	{/each}
</div>
