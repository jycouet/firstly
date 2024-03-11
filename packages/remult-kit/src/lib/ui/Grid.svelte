<script lang="ts" generics="T extends Record<any, any>">
  import { createEventDispatcher } from 'svelte'

  import { remult, type FieldMetadata } from 'remult'

  import { displayWithDefaultAndSuffix, getFieldMetaType, getRepoDisplayValue } from '../helper.js'
  import { LibIcon_Delete, LibIcon_Edit, type KitBaseItem, type KitStoreList } from '../index.js'
  import type { KitCell } from '../kitCellsBuildor.js'
  import Button from './Button.svelte'
  import Clipboardable from './Clipboardable.svelte'
  import GridLoading from './GridLoading.svelte'
  import Icon from './Icon.svelte'
  import { align, getAligns } from './index.js'
  import { LibIcon_Settings } from './LibIcon.js'
  import LinkPlus from './link/LinkPlus.svelte'

  export let cells: KitCell<T>[]
  export let store: KitStoreList<T>

  export let withEdit = false
  export let withDelete = false

  export let loadingRows = 5

  export let classes = {
    table: 'table-pin-rows table-pin-cols',
  }

  const getFieldLinkDisplayValue = (
    field: FieldMetadata,
    row: any,
  ): KitBaseItem & { href: string } => {
    const caption = field.displayValue(row)

    let href = ''
    if (field.options.href) {
      href = field.options.href(row)
    }

    return { id: '', caption, href }
  }

  const getEntityLinkDisplayValue = (
    field: FieldMetadata,
    row: any,
  ): KitBaseItem & { href: string } => {
    if (row === null || row === undefined) {
      return { href: '/', id: '', caption: '-' }
    }

    // REMULT BUG https://github.com/remult/remult/issues/239
    // const repo = remult.repo(field.target)
    // @ts-ignore
    const repo = remult.repo(field.entityDefs.entityType)
    // console.log(`field.entityDefs.entityType`, field.entityDefs.entityType)
    // console.log(`field.target`, field.target)

    return { href: '', ...getRepoDisplayValue('Grid.svelte', repo, row) }
  }

  const dispatch = createEventDispatcher()
</script>

<div class="overflow-x-auto">
  <table class="table {classes.table}">
    <thead>
      <tr>
        {#each cells as b, i}
          <th
            class="{align(b.field)} 
									{i === 0 ? 'rounded-tl-lg' : ''}
									{i === cells.length - 1 && !withEdit && !withDelete ? 'rounded-tr-lg' : ''}"
          >
            {#if b.headerSlot}
              <slot name="header" field={b.field} />
            {:else}
              {b.header ?? b.field?.caption}
            {/if}
          </th>
        {/each}

        {#if withEdit || withDelete}
          <th class="flex justify-end rounded-tr-lg">
            <Icon data={LibIcon_Settings}></Icon>
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#if $store.loading}
        <GridLoading columns={getAligns(cells, withEdit || withDelete)} {loadingRows} />
      {:else}
        {#each $store.items as row}
          <tr on:click={() => dispatch('rowclick', row)} class="hover:bg-base-content/20">
            {#each cells as b}
              {@const metaType = getFieldMetaType(b.field)}
              <td class={align(b.field)}>
                {#if metaType.kind === 'slot' || b.kind === 'slot'}
                  <slot name="cell" {row} field={b.field} />
                {:else if metaType.kind === 'relation'}
                  {@const item = getRepoDisplayValue(
                    'Grid.svelte',
                    metaType.repoTarget,
                    row[metaType.field.key],
                  )}
                  <LinkPlus {item} />
                {:else if b.kind === 'field_link'}
                  {@const item = getFieldLinkDisplayValue(metaType.field, row)}
                  <LinkPlus {item} />
                {:else if b.kind === 'entity_link'}
                  {@const item = getEntityLinkDisplayValue(metaType.field, row)}
                  <LinkPlus {item} />
                {:else if metaType.kind === 'enum'}
                  {@const t = metaType.field.displayValue(row)}
                  <LinkPlus item={row[metaType.field.key]}></LinkPlus>
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
                      class="btn btn-square btn-ghost btn-xs"
                      on:click={() => dispatch('edit', row)}
                    >
                      <Icon data={LibIcon_Edit} />
                    </Button>
                  {/if}
                  {#if withDelete}
                    <Button
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
          <tr>
            <td colspan={getAligns(cells, withEdit || withDelete).length} class="text-center py-12">
              Aucun résultat !
            </td>
          </tr>
        {/each}
        <slot name="extra" />
      {/if}
    </tbody>
  </table>
</div>
