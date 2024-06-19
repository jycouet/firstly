<script lang="ts">
  import { createTooltip } from '@melt-ui/svelte'
  import { fade } from 'svelte/transition'

  export let text = ''
  export let hideTooltip = false

  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createTooltip({
    positioning: {
      placement: 'top',
    },
    openDelay: 0,
    closeDelay: 0,
    closeOnPointerDown: false,
    forceVisible: true,
    closeOnEscape: true,
    group: true,
    // disableHoverableContent: true,
  })
</script>

<button type="button" class="trigger" {...$trigger} use:trigger aria-label="Add">
  <slot />
</button>
<!-- {hideTooltip} -->
{#if $open && !hideTooltip && (text || $$slots.tooltip)}
  <div
    {...$content}
    use:content
    transition:fade={{ duration: 100 }}
    class="bg-base-300 z-30 rounded-lg ring-1 ring-black"
  >
    <div {...$arrow} use:arrow />
    <div class="px-4 py-1">
      {#if $$slots.tooltip}
        <slot name="tooltip" />
      {:else}
        {text}
      {/if}
    </div>
  </div>
{/if}
