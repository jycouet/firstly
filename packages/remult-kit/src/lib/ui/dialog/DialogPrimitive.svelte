<script lang="ts">
  import { createDialog } from '@melt-ui/svelte'
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'

  import { LibIcon_Cross, tw, type KitBaseItemLight } from '../../'
  import { flyAndScale } from '../../utils/transition'
  import Icon from '../Icon.svelte'
  import LinkPlus from '../link/LinkPlus.svelte'

  export let detail: KitBaseItemLight | undefined = undefined
  export let open: boolean = false
  export let classes: { root?: string } = {}

  const {
    elements: { trigger, overlay, content, title: localTitle, description, close, portalled },
    states: { open: localOpen },
  } = createDialog({
    forceVisible: true,
    defaultOpen: open,
    closeOnOutsideClick: false,
    onOpenChange: (open) => {
      dispatchChange('yop there')
      return open.next
    },
  })

  const dispatch = createEventDispatcher()

  function dispatchChange(_data: any) {
    dispatch('change', _data)
  }
</script>

<div
  {...$portalled}
  use:$portalled.action
  class="fixed top-0 z-50 flex h-full w-full items-center justify-center"
>
  {#if $localOpen}
    <div
      {...$overlay}
      use:$overlay.action
      class="bg-base-300/80 fixed inset-0 z-40 blur-sm"
      transition:fade={{ duration: 150 }}
    />
    <div
      class={tw(
        `border-base-content/60
			   bg-base-100 z-40 overflow-auto rounded-xl border
			   p-6 shadow-lg`,
        classes.root,
      )}
      transition:flyAndScale={{
        duration: 150,
        y: 8,
        start: 0.96,
      }}
      {...$content}
      use:$content.action
    >
      <div class="flex h-full min-w-[25rem] flex-col gap-4">
        <h2 {...$localTitle} use:$localTitle.action class="m-0 text-lg font-medium">
          <div class="flex items-center justify-between gap-4">
            <LinkPlus item={detail}></LinkPlus>
            <button
              {...$close}
              use:$close.action
              aria-label="close"
              class="btn btn-circle btn-outline btn-lg
              h-max min-h-0 w-max border-none"
            >
              <Icon data={LibIcon_Cross}></Icon>
            </button>
          </div>
        </h2>

        <!-- FIXME: ERMIN? overflow?  -->
        <!-- <div class="overflow-y-auto"> -->
        <slot />

        {#if $$slots.actions}
          <div class="mt-2 flex items-end justify-end">
            <slot name="actions" />
          </div>
        {/if}
        <!-- </div> -->
      </div>
    </div>
  {/if}
</div>
