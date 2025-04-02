<script lang="ts">
	import FieldContainer from './internals/FieldContainer.svelte'
	import Loading from './Loading.svelte'

	interface Props {
		label?: string
		totalCount?: number | undefined | null
	}

	let { label = 'Stats', totalCount = undefined }: Props = $props()
</script>

<FieldContainer {label} forId="paginate" classes={{ label: 'justify-end' }}>
	<div class="flex w-14 items-center justify-end">
		{#if totalCount === undefined}
			<Loading class="ml-6 mr-2 h-3 w-1/6"></Loading>
			<Loading class="mx-2 h-4 w-1/2"></Loading>
			<Loading class="mx-2 h-3 w-1/6"></Loading>
		{:else}
			<span class="text-primary justify-end px-2 font-bold">
				{totalCount}
			</span>
		{/if}
	</div>
</FieldContainer>
