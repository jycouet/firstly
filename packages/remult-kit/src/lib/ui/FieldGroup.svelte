<script lang="ts" generics="T extends Record<any, any>">
  import { onMount } from 'svelte'

  import type { FieldMetadata } from 'remult'

  import { tw, type KitStoreItem } from '..'
  import type { KitCell } from '../kitCellsBuildor'
  import Field from './Field.svelte'
  import FieldContainer from './internals/FieldContainer.svelte'
  import Loading from './Loading.svelte'

  type Mode = 'edit' | 'view' | 'filtre'
  export let mode: Mode = 'edit'

  export let cells: KitCell<T>[]
  export let store: KitStoreItem<T>

  export let focusKey: string | null | undefined = null

  const getError = (errors: any, field: FieldMetadata<any, any>) => {
    // REMULT to get the error of CategoryId in Category
    // @ts-ignore
    const keyToUse = field.options.field ?? field.key

    if (errors && errors[keyToUse]) {
      return errors[keyToUse]
    }
    return undefined
  }

  const shouldHide = (c: KitCell<T>, mode: Mode) => {
    if (mode === 'edit' && c.modeEdit === 'hide') {
      return true
    }
    if (mode === 'view' && c.modeView === 'hide') {
      return true
    }
    return false
  }

  const modeToUse = (c: KitCell<T>, mode: Mode) => {
    if (mode === 'edit' && c.modeEdit === 'view') {
      return 'view'
    }
    if (mode === 'view' && c.modeView === 'edit') {
      return 'edit'
    }
    return mode
  }

  const isDisableFieldDynamic = (c: KitCell<T>) => {
    if (c.disabledCondition) {
      const existsKey = c.disabledCondition.exists
      if (existsKey) {
        const isArray = Array.isArray($store.item?.[existsKey])
        if (isArray && $store.item?.[existsKey]?.length) {
          return true
        } else if (!isArray && $store.item?.[existsKey]) {
          return true
        }
      }
    }
  }

  onMount(() => {
    dynamicValues = dynamicItemValues(cells, $store.item)
  })

  let dynamicValues: any = {}

  const dynamicItemValues = (cells: KitCell<T>[], item: any) => {
    const res: any = {}
    for (const c of cells) {
      if (c.filter?.on) {
        res[c.filter?.on] = item[c.filter?.on]
      }
      if (c.copyForNarrowFind) {
        c.copyForNarrowFind.forEach((key) => {
          res[key] = item[key]
        })
      }
    }
    res.id = item?.id
    return res
  }

  const isDynamicValuesChanged = (cells: KitCell<T>[]) => {
    for (const c of cells) {
      if (c.filter?.on) {
        if (dynamicValues[c.filter?.on] !== $store.item?.[c.filter?.on]) {
          return true
        }
      }
    }
  }

  $: {
    if (isDynamicValuesChanged(cells)) {
      dynamicValues = dynamicItemValues(cells, $store.item)
    }
  }

  let size = ['', 'w-1/2', 'w-1/3', 'w-1/4', 'w-1/5', 'w-1/6']
</script>

{#each cells as cell, i}
  {#if shouldHide(cell, mode)}
    <!-- Do nothing -->
  {:else}
    <div class={cell.class}>
      {#if cell.kind === 'header'}
        <span>{cell.header}</span>
      {:else if cell.field && (!$store || $store.loading)}
        <!-- If the store is not ready mdiYeast, or in loading... -->
        <FieldContainer label={cell.field.caption} forId={cell.field.key}>
          <Loading
            class={tw(
              `mx-4 my-3 h-6`,
              size[parseInt((((i + 1) * Math.random() * size.length) % size.length).toString())],
            )}
          />
        </FieldContainer>
      {:else if cell.kind === 'slot'}
        <slot name="field" field={cell.field} />
      {:else if cell.field && $store.item}
        <Field
          mode={modeToUse(cell, mode)}
          {cell}
          cellsValues={dynamicValues}
          bind:value={$store.item[cell.field.key]}
          error={getError($store.errors, cell.field)}
          focus={focusKey === cell.field.key}
          disabled={isDisableFieldDynamic(cell)}
        />
      {:else}
        Case not handled
      {/if}
    </div>
  {/if}
{/each}
