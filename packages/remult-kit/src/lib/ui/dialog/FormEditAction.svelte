<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { KitStoreItem } from '../..'
  import Button from '../Button.svelte'
  import Icon from '../Icon.svelte'
  import { LibIcon_Add, LibIcon_Check, LibIcon_Delete } from '../LibIcon'
  import type { DialogMetaDataInternal } from './dialog'

  export let toShow: DialogMetaDataInternal
  export let store: KitStoreItem<any>

  const dispatch = createEventDispatcher()

  function dispatchDelete() {
    dispatch('delete')
  }
</script>

<div class="mt-2 flex items-center justify-between">
  {#if toShow.type === 'update'}
    {#if toShow.wDelete}
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

    <Button class="text-white" {...$$restProps} isLoading={$store.loading}>
      <Icon data={LibIcon_Check} />
      <p>Sauvegarder</p>
    </Button>
  {/if}

  {#if toShow.type === 'insert'}
    <div>
      {#if $store.globalError}
        <span class="text-error text-xs">{$store.globalError}</span>
      {/if}
    </div>

    <Button class="text-white" {...$$restProps} isLoading={$store.loading}>
      <Icon data={LibIcon_Add} />
      <p>Créer</p>
    </Button>
  {/if}
</div>
