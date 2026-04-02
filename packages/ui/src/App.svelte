<script lang="ts">
	import { onMount } from 'svelte'

	const modules = {
		admin: import('./lib/modules/admin/Page.svelte'),
		storage: import('./lib/modules/storage/Page.svelte'),
	} as const

	export let firstlyData: { module: keyof typeof modules; debug?: boolean }

	let activeModuleRef: any

	// Function to load a specific module
	function loadModule(moduleName: keyof typeof modules) {
		activeModuleRef = modules[moduleName]
	}

	const getKeys = () => Object.keys(modules) as (keyof typeof modules)[]

	// Load the initial module based on firstlyData
	onMount(() => {
		loadModule(firstlyData.module)
	})
</script>

<main>
	{#if activeModuleRef}
		{#await activeModuleRef then { default: ModuleComponent }}
			<ModuleComponent {firstlyData} />
		{/await}
	{/if}
</main>

{#if firstlyData.debug}
	{console.info(firstlyData)}
	<div class="debug">
		{#each getKeys() as module}
			<button on:click={() => loadModule(module)}>Load {module}</button>
		{/each}
	</div>
{/if}

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
