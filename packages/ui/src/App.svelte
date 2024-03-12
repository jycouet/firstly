<script lang="ts">
  import { onMount } from 'svelte'

  const modules = {
    auth: import('./lib/modules/auth/Page.svelte'),
    admin: import('./lib/modules/admin/Page.svelte'),
    storage: import('./lib/modules/storage/Page.svelte'),
  }

  let activeModule: any = remultKitData.module
  let activeModuleRef: any

  // Function to load a specific module
  function loadModule(moduleName) {
    activeModule = moduleName
    activeModuleRef = modules[moduleName]
  }

  // Load the initial module based on remultKitData
  onMount(() => {
    loadModule(remultKitData.module)
  })
</script>

<main>
  {#if activeModuleRef}
    {#await activeModuleRef then { default: ModuleComponent }}
      <ModuleComponent {remultKitData} />
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
