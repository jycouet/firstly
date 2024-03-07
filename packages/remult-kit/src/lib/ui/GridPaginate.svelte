<script lang="ts">
	import Icon from './Icon.svelte'
	import FieldContainer from './internals/FieldContainer.svelte'

	import './LibIcon'

	import { LibIcon_ChevronLeft, LibIcon_ChevronRight } from './LibIcon'
	import Loading from './Loading.svelte'

	export let page: number
	export let totalCount: number | undefined | null = undefined
	export let pageSize: number = 25

	const update = (op: '+' | '-') => {
		if (op === '+') {
			if (canGoNext) {
				page = page + 1
			}
		} else {
			if (page > 1) {
				page = page - 1
			}
		}
	}

	$: isValidValue = totalCount !== undefined && totalCount !== null
	$: needPaginate = isValidValue && (totalCount ?? 0) > pageSize
	$: canGoNext = isValidValue && needPaginate && page < Math.ceil((totalCount ?? 0) / pageSize)
</script>

<FieldContainer label="Pagination" forId="paginate" classes={{ label: 'justify-end' }}>
	<div class="flex items-center justify-end">
		{#if totalCount === undefined}
			<Loading class="mx-2 h-8 w-1/2"></Loading>
		{:else if !needPaginate}
			<span class="justify-end px-2 font-bold text-primary">
				{totalCount}
			</span>
		{:else}
			<div class="join">
				<button
					aria-label="left"
					on:click={() => update('-')}
					class="btn join-item {page === 1 ? 'btn-disabled' : ''}"
				>
					<Icon data={LibIcon_ChevronLeft} />
				</button>
				{#if isValidValue}
					<button aria-label="current" class="btn join-item px-0">
						<span class="font-bold text-primary">{totalCount}</span>
						<span class="text-[0.55rem] italic">({page} / {Math.ceil((totalCount ?? 0) / pageSize)})</span
						>
					</button>
				{:else}
					<button aria-label="loading" class="btn join-item animate-pulse">.....</button>
				{/if}
				<button
					aria-label="right"
					on:click={() => update('+')}
					class="btn join-item {!canGoNext ? 'btn-disabled' : ''}"
				>
					<Icon data={LibIcon_ChevronRight} />
				</button>
			</div>
		{/if}
	</div>
</FieldContainer>
