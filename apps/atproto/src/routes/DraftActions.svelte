<script lang="ts">
	import type { FfNote, FfReview } from '$lib/entities'

	import Did from './Did.svelte'

	let {
		draft,
		me,
		busy,
		published,
		reviews,
		onpublish,
		onreview,
	}: {
		draft: FfNote
		me: string
		busy: boolean
		published: boolean
		reviews: FfReview[]
		onpublish: (d: FfNote) => void
		onreview: (d: FfNote, text: string) => void
	} = $props()

	let text = $state('')
</script>

<div class="flex flex-col gap-1 text-xs">
	{#if draft.did === me}
		<div class="flex items-center gap-2">
			<button
				class="border-border rounded-md border px-2"
				disabled={busy}
				onclick={() => onpublish(draft)}>{published ? 'publish again' : 'copy to public'}</button
			>
			{#if published}<span class="text-muted-foreground">published (same rkey)</span>{/if}
		</div>
	{/if}
	<ul class="flex flex-col gap-0.5">
		{#each reviews as r (r.uri)}
			<li><Did did={r.did} {me} /> {r.text}</li>
		{/each}
	</ul>
	<form
		class="flex gap-1"
		onsubmit={(e) => {
			e.preventDefault()
			if (!text.trim()) return
			onreview(draft, text)
			text = ''
		}}
	>
		<input
			bind:value={text}
			placeholder="review"
			class="border-input rounded-md border px-2 py-0.5"
		/>
		<button class="border-border rounded-md border px-2" disabled={busy}>send</button>
	</form>
</div>
