<script lang="ts">
  import { createCombobox, createSync, type ComboboxOptionProps } from '@melt-ui/svelte'
  import { createEventDispatcher, onMount } from 'svelte'
  import { fly } from 'svelte/transition'

  import {
    LibIcon_Check,
    LibIcon_Cross,
    LibIcon_MultiCheck,
    LibIcon_Search,
    tw,
    type KitBaseItem,
    type KitIcon,
  } from '../../..'
  import Icon from '../../Icon.svelte'

  export let id: string
  export let disabled: boolean = false
  export let placeholder: string = ''
  export let items: KitBaseItem[] = []
  let totalCount: number | undefined = undefined

  export let loadOptions:
    | ((str: string) => Promise<{ items: KitBaseItem[]; totalCount: number }>)
    | undefined = undefined
  export let values: string[] | undefined = undefined
  export let clearable = false

  const dispatch = createEventDispatcher()

  function dispatchSelectedValues(_data: KitBaseItem[] | undefined) {
    values = _data?.map((_data) => _data.id)
    dispatch('selected', _data)
  }

  onMount(async () => {
    if (loadOptions) {
      const lo = await loadOptions('')
      items = lo.items
      totalCount = lo.totalCount
      filteredItems = items
    }
  })

  const getDefaultValues = (_selectedValue: string[] | undefined) => {
    if (!items) {
      return []
    }

    const f = items.filter((c) => (_selectedValue ?? []).includes(String(c.id)))
    if (f) {
      return f.map((c) => toOption(c))
    }

    return []
  }

  const toOption = (
    item: KitBaseItem,
  ): ComboboxOptionProps<KitBaseItem> & {
    icon?: KitIcon
  } => ({
    value: item,
    label: item.caption,
    // icon: item.icon,
    // disabled: item.disabled,
  })

  const {
    elements: { menu, input, option },
    states: { open, inputValue, touchedInput, selected: localSelected },
    helpers: { isSelected },
  } = createCombobox<KitBaseItem, true>({
    forceVisible: true,
    multiple: true,
    disabled,
    ids: { label: id },
  })

  const clearSelection = () => {
    sync.selected(undefined)
  }

  let debounceTimer: ReturnType<typeof setTimeout>
  const debounce = (callback: () => void) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(
      callback,
      // debounce only if we have a load option
      loadOptions ? 444 : 0,
    )
  }

  const sync = createSync({ selected: localSelected })
  $: items &&
    sync.selected(getDefaultValues(values), (v) => {
      const list = (v ?? []).map((c) => c.value.id)

      // Create a map to count occurrences of each element
      const countMap: Map<string, number> = new Map()

      list.forEach((item) => {
        countMap.set(item, (countMap.get(item) || 0) + 1)
      })

      // Filter the list to include only elements that occur exactly once
      const uniqueList: string[] = list.filter((item) => countMap.get(item) === 1)

      const newIds = uniqueList.sort().join(',')
      const oldSelectedValues = (values ?? []).sort().join(',')

      if (newIds !== oldSelectedValues) {
        dispatchSelectedValues(
          v === undefined
            ? undefined
            : v.filter((c) => uniqueList.includes(c.value.id)).map((c) => c.value),
        )
      }
    })

  const labelToDisplayInInput = (_localSelected: typeof $localSelected) => {
    if (_localSelected === undefined || _localSelected.length === 0) {
      return ''
    }
    if (_localSelected.length === 1) {
      return _localSelected[0].label ?? ''
    }
    return `${_localSelected.length} éléments`
  }
  $: $inputValue = labelToDisplayInInput($localSelected)

  const iconToDisplayInInput = (_localSelected: typeof $localSelected): KitIcon => {
    if (_localSelected === undefined || _localSelected.length === 0) {
      return { data: LibIcon_Search }
    }
    if (_localSelected.length === 1) {
      return _localSelected[0].value.icon ?? { data: LibIcon_Search }
    }
    return { data: LibIcon_MultiCheck }
  }

  const isChecked = (_localSelected: typeof $localSelected, _item: KitBaseItem) => {
    const f = (_localSelected ?? []).filter((c) => c.value?.id === _item.id)
    if (f.length > 0) {
      return true
    }
    return false
  }

  let filteredItems = items
  const calcFilteredItems = (touched: boolean, str: string, values: any) => {
    if (touched && !str.endsWith(' éléments')) {
      debounce(async () => {
        const normalizedInput = str.toLowerCase()

        // TODO one day
        // In a Multi select we can't filter to the server.
        // If we do I don't knwo what to set to $inputValue. and and list gets shorter... So what do we do about items that are selected but not in the list anymore (because of the filter) ?
        // if (loadOptions) {
        //   const lo = await loadOptions(normalizedInput)
        //   items = lo.items
        //   totalCount = lo.totalCount
        //   filteredItems = items
        // } else {
        filteredItems = items.filter((item) => {
          return item.caption?.toLowerCase().includes(normalizedInput)
        })
        // }
      })
    } else {
      filteredItems = items
    }
  }

  $: calcFilteredItems($touchedInput, $inputValue, values)
</script>

<div class="input input-bordered flex min-w-0 items-center">
  <div class="relative">
    {#if iconToDisplayInInput($localSelected)}
      {@const ico = iconToDisplayInInput($localSelected)}
      <Icon
        data={ico?.data}
        class={tw(['relative', ico?.class])}
        style={ico?.style}
        size={ico?.size}
      ></Icon>
    {/if}
  </div>
  <!-- {id} -->
  <input
    {...$input}
    use:$input.action
    class="-ml-8 -mr-5 h-full min-w-0 flex-grow bg-transparent px-10"
    {placeholder}
  />
  <div class="pointer-events-none relative right-0 flex gap-2">
    {#if clearable && $localSelected && $localSelected.length > 0}
      <button on:click={clearSelection} class="pointer-events-auto">
        <Icon data={LibIcon_Cross}></Icon>
      </button>
    {/if}
    <!-- {#if $open}
      <Icon data={LibIcon_ChevronUp}></Icon>
    {:else}
      <Icon data={LibIcon_ChevronDown}></Icon>
    {/if} -->
  </div>
</div>

{#if $open}
  <ul
    class="border-base-content/20 z-50 flex max-h-[300px] flex-col overflow-hidden rounded-lg border"
    {...$menu}
    use:$menu.action
    transition:fly={{ duration: 150, y: -5 }}
  >
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="bg-base-100 flex max-h-full flex-col gap-0 overflow-y-auto py-2" tabindex="0">
      {#each filteredItems as item, index (index)}
        <li
          {...$option(toOption(item))}
          use:$option.action
          class="data-[highlighted]:bg-primary data-[highlighted]:text-primary-content relative flex cursor-pointer scroll-my-2 items-center
          rounded-md
          px-1
          py-2
					data-[disabled]:opacity-50"
        >
          {#if isChecked($localSelected, item)}
            <Icon data={LibIcon_Check} class="w-6"></Icon>
          {:else}
            <!-- just to book the place -->
            <span class="w-6"></span>
          {/if}
          {#if item.icon?.data}
            <Icon
              data={item.icon.data}
              class={tw(['flex-shrink-0', item.icon.class])}
              style={item.icon.style}
              size={item.icon.size}
            ></Icon>
          {/if}
          <div class="pl-2 {item.class}">
            <span class="font-medium">{item.caption}</span>
          </div>
        </li>
      {:else}
        <li class="relative cursor-pointer rounded-md py-1 pl-8 pr-4">Aucun résultat</li>
      {/each}
    </div>
    {#if totalCount}
      <div class="bg-base-300 z-50 text-center text-xs">
        {#if items.length < totalCount}
          ({items.length} / {totalCount})
        {:else}
          <!-- yes, items.length can be bigger if the selected item is not in the limit -->
          ({items.length})
        {/if}
      </div>
    {/if}
  </ul>
{/if}
