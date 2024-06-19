<script lang="ts" generics="T extends any">
  import { createEventDispatcher } from 'svelte'

  import type { KitStoreItem } from '../..'
  import Button from '../Button.svelte'
  import Icon from '../Icon.svelte'
  import { LibIcon_Add, LibIcon_Check, LibIcon_Delete } from '../LibIcon'
  import type { DialogType } from './dialog'

  export let store: KitStoreItem<T>
  export let type: DialogType
  export let wDelete = false

  export let textCreate = 'Créer'

  const dispatch = createEventDispatcher()

  function dispatchDelete() {
    dispatch('delete')
  }
</script>

<div class="mt-2 flex items-center justify-between">
  {#if type === 'update'}
    <div class="flex items-center justify-start">
      {#if wDelete}
        <Button
          type="button"
          on:click={dispatchDelete}
          class="btn-outline btn-error mr-4 text-white"
          isLoading={$store.loading}
        >
          <Icon data={LibIcon_Delete} />
        </Button>
      {/if}

      <div>
        {#if $store.globalError}
          <span class="text-error text-xs">{$store.globalError}</span>
        {/if}
      </div>
    </div>

    <Button class="text-white" {...$$restProps} isLoading={$store.loading}>
      <Icon data={LibIcon_Check} />
      <p>Sauvegarder</p>
    </Button>
  {/if}

  {#if type === 'insert'}
    <div>
      {#if $store.globalError}
        <span class="text-error text-xs">{$store.globalError}</span>
      {/if}
    </div>

    <Button class="text-white" {...$$restProps} isLoading={$store.loading}>
      <Icon data={LibIcon_Add} />
      <p>{textCreate}</p>
    </Button>
  {/if}
</div>
