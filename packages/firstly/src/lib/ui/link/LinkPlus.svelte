<script lang="ts">
  import { type BaseItemLight } from '../..'
  import Icon from '../Icon.svelte'
  import Tooltip from '../Tooltip.svelte'
  import Link from './Link.svelte'

  export let item: BaseItemLight | undefined
  export let noIcon = false
  export let captionSubStyle: 'under' | 'inline' | 'none' = 'under'

  const hasSomethingToDisplay = (item: BaseItemLight) => {
    if (item.href) {
      return true
    }
    if (item.caption) {
      return true
    }
    return false
  }
</script>

<div class="flex items-center gap-4">
  {#if item}
    {#if item.icon?.data && !noIcon}
      {#if item.icon.caption}
        <Tooltip text={item.icon.caption}>
          <Icon {...item.icon} />
        </Tooltip>
      {:else}
        <Icon {...item.icon} />
      {/if}
    {/if}

    {#if hasSomethingToDisplay(item)}
      <div class="flex flex-col items-start">
        {#if item.href}
          <div>
            <Link href={item.href}>{item.caption}</Link>
            {#if item.captionSub && captionSubStyle === 'inline'}
              <span class="text-base-content/70 text-xs italic">{item.captionSub}</span>
            {/if}
          </div>
        {:else}
          <!-- 20 is a cool value ! -->
          <span
            class="text-base-content {item.class} {(item.caption ?? '').length < 20
              ? 'text-nowrap'
              : ''}"
          >
            {item.caption ?? '-'}
          </span>
        {/if}
        {#if item.captionSub && captionSubStyle === 'under'}
          <span class="text-base-content/70 text-xs italic">{item.captionSub}</span>
        {/if}
      </div>
    {/if}
  {/if}
</div>
