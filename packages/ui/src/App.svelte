<script lang="ts">
  import { onMount } from 'svelte'

  // import type { RemultKitData } from '../../remult-kit/src/lib/auth/types'

  const modules = {
    auth: import('./lib/modules/auth/Page.svelte'),
    admin: import('./lib/modules/admin/Page.svelte'),
    storage: import('./lib/modules/storage/Page.svelte'),
  } as const

  // @ts-expect-error
  const localRemultKitData = remultKitData

  let activeModuleRef: any

  // Function to load a specific module
  function loadModule(moduleName: keyof typeof modules) {
    activeModuleRef = modules[moduleName]
  }

  // Load the initial module based on remultKitData
  onMount(() => {
    loadModule(localRemultKitData.module)
  })
</script>

<main>
  {#if activeModuleRef}
    {#await activeModuleRef then { default: ModuleComponent }}
      <ModuleComponent remultKitData={localRemultKitData} />
    {/await}
  {/if}
</main>

<div class="debug">
  {#each Object.keys(modules) as module}
    <button on:click={() => loadModule(module)}>Load {module}</button>
  {/each}
</div>

<style>
  .debug {
    display: flex;
    position: fixed;
    gap: 5px;
    bottom: 5px;
    right: 5px;
  }

  button {
    font-size: 11px;
  }
</style>
