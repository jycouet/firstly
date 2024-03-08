<script lang="ts">
  import { onMount } from 'svelte'

  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'
  import viteLogo from '/vite.svg'

  export let remultKitData: any

  let one: any
  let two: any

  function loadOne() {
    one = import('./One.svelte')
  }

  function loadTwo() {
    two = import('./Two.svelte')
  }

  onMount(async () => {
    console.log('remultKitData', remultKitData)

    if (remultKitData.component == 'One') {
      loadOne()
    } else if (remultKitData.component == 'Two') {
      loadTwo()
    }
  })
</script>

<main>
  <div>
    <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Remult + kit</h1>

  <div class="card">
    <Counter />

    {#if one}
      {#await one then { default: One }}
        <One name="yoyoyo" />
      {/await}
    {/if}

    {#if two}
      {#await two then { default: Two }}
        <Two name="yoyoyo two" />
      {/await}
    {/if}

    <button on:click={loadOne}>{remultKitData?.button?.label ?? 'no label'}</button>
    <button on:click={loadTwo}>Load Two</button>
  </div>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer"
      >SvelteKit</a
    >, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
