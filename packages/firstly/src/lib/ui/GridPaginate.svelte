<script lang="ts">
  import Icon from './Icon.svelte'
  import FieldContainer from './internals/FieldContainer.svelte'

  import './LibIcon'

  import { LibIcon_ChevronLeft, LibIcon_ChevronRight } from './LibIcon'
  import Loading from './Loading.svelte'

  export let label = 'Pagination'
  export let pageDisplayed: number
  export let totalCount: number | undefined | null = undefined
  export let pageSize: number = 25

  const update = (op: '+' | '-') => {
    if (op === '+') {
      if (canGoNext) {
        pageDisplayed = pageDisplayed + 1
      }
    } else {
      if (pageDisplayed > 1) {
        pageDisplayed = pageDisplayed - 1
      }
    }
  }

  $: isValidValue = totalCount !== undefined && totalCount !== null
  $: needPaginate = isValidValue && (totalCount ?? 0) > pageSize
  $: canGoNext =
    isValidValue && needPaginate && pageDisplayed < Math.ceil((totalCount ?? 0) / pageSize)
</script>

<FieldContainer {label} forId="paginate" classes={{ label: 'justify-end' }}>
  <div class="flex w-36 items-center justify-end">
    {#if totalCount === undefined}
      <Loading class="ml-6 mr-2 h-3 w-1/6"></Loading>
      <Loading class="mx-2 h-4 w-1/2"></Loading>
      <Loading class="mx-2 h-3 w-1/6"></Loading>
    {:else if !needPaginate}
      <span class="text-primary justify-end px-2 font-bold">
        {totalCount}
      </span>
    {:else}
      <div class="join">
        <button
          aria-label="left"
          on:click={() => update('-')}
          class="btn join-item p-1 {pageDisplayed === 1 ? 'btn-disabled' : ''}"
        >
          <Icon data={LibIcon_ChevronLeft} />
        </button>
        {#if isValidValue}
          <button aria-label="current" class="btn join-item px-0">
            <span class="text-primary font-bold">{totalCount}</span>
            <span class="text-[0.55rem] italic"
              >({pageDisplayed} / {Math.ceil((totalCount ?? 0) / pageSize)})</span
            >
          </button>
        {:else}
          <button aria-label="loading" class="btn join-item animate-pulse">.....</button>
        {/if}
        <button
          aria-label="right"
          on:click={() => update('+')}
          class="btn join-item p-1 {!canGoNext ? 'btn-disabled' : ''}"
        >
          <Icon data={LibIcon_ChevronRight} />
        </button>
      </div>
    {/if}
  </div>
</FieldContainer>
