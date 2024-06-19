<script lang="ts" generics="T extends Record<any, any>">
  import { createEventDispatcher } from 'svelte'

  import type { EntityOrderBy } from 'remult'

  import {
    displayWithDefaultAndSuffix,
    getEntityDisplayValue,
    getEntityDisplayValueFromField,
    getFieldLinkDisplayValue,
    getFieldMetaType,
  } from '../helper.js'
  import { LibIcon_Delete, LibIcon_Edit, type KitStoreList } from '../index.js'
  import type { KitCell } from '../kitCellsBuildor.js'
  import Button from './Button.svelte'
  import Clipboardable from './Clipboardable.svelte'
  import GridLoading from './GridLoading.svelte'
  import Icon from './Icon.svelte'
  import { align, getAligns } from './index.js'
  import {
    LibIcon_Add,
    LibIcon_Settings,
    LibIcon_Sort,
    LibIcon_SortAsc,
    LibIcon_SortDesc,
  } from './LibIcon.js'
  import LinkPlus from './link/LinkPlus.svelte'

  export let cells: KitCell<T>[]
  export let store: KitStoreList<T>

  export let withAdd = false
  export let withEdit = false
  export let withDelete = false

  export let loadingRows = 5

  export let classes = {
    table: 'table-pin-rows table-pin-cols',
  }
  export let orderBy: EntityOrderBy<T> | undefined = undefined
  export let orderByCols: (keyof T)[] | true | undefined = undefined

  export let dicoNoResult = 'Aucun résultat !'

  const dispatch = createEventDispatcher()

  const sorting = (toSort: boolean, b: KitCell<T>) => {
    if (!toSort) {
      return
    }
    if (orderBy === undefined) {
      // @ts-ignore
      orderBy = { [b.field.key]: 'asc' }
      // @ts-ignore
    } else if (orderBy[b.field.key] === 'asc') {
      // @ts-ignore
      orderBy = { [b.field.key]: 'desc' }
      // @ts-ignore
    } else if (orderBy[b.field.key] === undefined) {
      // @ts-ignore
      orderBy = { [b.field.key]: 'asc' }
    } else {
      orderBy = undefined
    }
  }

  const sortingIcon = (toSort: boolean, b: KitCell<T>, _orderBy: EntityOrderBy<T> | undefined) => {
    if (!toSort) {
      return
    }
    // @ts-ignore
    if (_orderBy && _orderBy[b.field.key] === 'asc') {
      return { data: LibIcon_SortAsc, class: 'text-primary' }
    }
    // @ts-ignore
    if (_orderBy && _orderBy[b.field.key] === 'desc') {
      return { data: LibIcon_SortDesc, class: 'text-primary' }
    }
    return { data: LibIcon_Sort }
  }
</script>

<div class="overflow-x-auto">
  <table class="table {classes.table}">
    <thead>
      <tr>
        {#each cells as b, i}
          {@const al = align(b.field, b.kind === 'slot')}
          <th
            class="{al} 
									{i === 0 ? 'rounded-tl-lg' : ''}
									{i === cells.length - 1 && !withEdit && !withDelete ? 'rounded-tr-lg' : ''}"
          >
            {#if b.headerSlot}
              <slot name="header" field={b.field} />
            {:else}
              {@const toSort =
                orderByCols === true || (orderByCols && orderByCols.includes(b.field?.key))}
              {#if toSort}
                <button
                  class="flex items-center justify-between gap-2"
                  disabled={!toSort}
                  on:click={() => sorting(toSort ?? false, b)}
                >
                  {b.header ?? b.field?.caption}
                  {#if toSort}
                    <Icon {...sortingIcon(toSort ?? false, b, orderBy)}></Icon>
                  {/if}
                </button>
              {:else}
                {b.header ?? b.field?.caption}
              {/if}
            {/if}
          </th>
        {/each}

        {#if withEdit || withDelete || withAdd}
          <th class="flex justify-end rounded-tr-lg">
            {#if withAdd}
              <Button
                disabled={!store.getRepo().metadata.apiUpdateAllowed()}
                class="btn btn-square btn-ghost btn-xs"
                on:click={() => dispatch('add', {})}
              >
                <Icon data={LibIcon_Add} />
              </Button>
            {:else}
              <Icon data={LibIcon_Settings}></Icon>
            {/if}
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      <!-- Show loading only if there is no items and loading is true, like this on an update, there will be no jump -->
      {#if $store.items.length === 0 && $store.loading}
        <GridLoading columns={getAligns(cells, withEdit || withDelete)} {loadingRows} />
      {:else}
        {#each $store.items as row}
          <tr on:click={() => dispatch('rowclick', row)} class="hover:bg-base-content/20">
            {#each cells as b}
              {@const metaType = getFieldMetaType(b.field)}
              <td class={align(b.field, b.kind === 'slot')}>
                {#if metaType.kind === 'slot' || b.kind === 'slot'}
                  <slot name="cell" {row} field={b.field} cell={b} />
                {:else if b.kind === 'component'}
                  {#if b.component}
                    <div class={b.class}>
                      <svelte:component
                        this={b.component}
                        {...b.props}
                        {...b.rowToProps ? b.rowToProps(row) : {}}
                        on:refresh
                      ></svelte:component>
                    </div>
                  {:else}
                    <pre>Col: {b.col}</pre>
                    <pre class="bg-error">Component prop needed !</pre>
                  {/if}
                {:else if metaType.kind === 'relation'}
                  {@const item = getEntityDisplayValue(
                    metaType.repoTarget,
                    row[metaType.field.key],
                  )}
                  <LinkPlus
                    item={{
                      ...item,
                      href: b.field?.options?.href ? b.field?.options.href(row) : item?.href,
                    }}
                  />
                {:else if b.kind === 'field_link'}
                  {@const item = getFieldLinkDisplayValue(metaType.field, row)}
                  <LinkPlus {item} />
                {:else if b.kind === 'entity_link'}
                  {@const item = getEntityDisplayValueFromField(metaType.field, row)}
                  <LinkPlus {item} />
                {:else if metaType.kind === 'enum'}
                  {#if metaType.subKind === 'single'}
                    <LinkPlus item={row[metaType.field.key]}></LinkPlus>
                  {:else if metaType.subKind === 'multi'}
                    {@const t = metaType.field.displayValue(row)}
                    {t}
                  {/if}
                {:else if metaType.subKind === 'checkbox'}
                  {@const t = metaType.field.displayValue(row)}
                  {t === 'true' ? 'Oui' : 'Non'}
                {:else}
                  {@const t = displayWithDefaultAndSuffix(metaType.field, row[metaType.field.key])}
                  {#if b.clipboardable}
                    <Clipboardable value={t}>
                      <!-- 20 is a cool value ! -->
                      <span class={t.length < 20 ? 'text-nowrap' : ''}>
                        {t}
                      </span>
                    </Clipboardable>
                  {:else}
                    <!-- 20 is a cool value ! -->
                    <span class={t.length < 20 ? 'text-nowrap' : ''}>
                      {t}
                    </span>
                  {/if}
                {/if}
              </td>
            {/each}
            {#if withEdit || withDelete}
              <td class="text-right">
                <div class="flex justify-end gap-2">
                  {#if withEdit}
                    <Button
                      disabled={!store.getRepo().metadata.apiUpdateAllowed()}
                      class="btn btn-square btn-ghost btn-xs"
                      on:click={() => dispatch('edit', row)}
                    >
                      <Icon data={LibIcon_Edit} />
                    </Button>
                  {/if}
                  {#if withDelete}
                    <Button
                      disabled={!store.getRepo().metadata.apiDeleteAllowed()}
                      class="btn btn-square btn-ghost btn-xs"
                      on:click={() => dispatch('delete', row)}
                    >
                      <Icon data={LibIcon_Delete} />
                    </Button>
                  {/if}
                </div>
              </td>
            {/if}
          </tr>
        {:else}
          {#if dicoNoResult}
            <tr>
              <td
                colspan={getAligns(cells, withEdit || withDelete).length}
                class="text-center py-12"
              >
                {dicoNoResult}
              </td>
            </tr>
          {/if}
        {/each}
        <slot name="extra" />
      {/if}
    </tbody>
  </table>
</div>
