<script lang="ts" generics="T extends any">
	import { createEventDispatcher } from 'svelte'

	import type { StoreItem } from '../../internals'
	import Button from '../Button.svelte'
	import Icon from '../Icon.svelte'
	import { LibIcon_Add, LibIcon_Check, LibIcon_Delete } from '../LibIcon'
	import type { DialogType } from './dialog'

	export let store: StoreItem<T>
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
					onclick={dispatchDelete}
					class="mr-4 btn-error"
					isLoading={$store.loading}
				>
					<Icon data={LibIcon_Delete} />
				</Button>
			{/if}

			<div>
				{#if $store.globalError}
					<span class="text-xs text-error">{$store.globalError}</span>
				{/if}
			</div>
		</div>

		<Button class="btn-primary" {...$$restProps} isLoading={$store.loading}>
			<Icon data={LibIcon_Check} />
			<p>Sauvegarder</p>
		</Button>
	{/if}

	{#if type === 'insert'}
		<div>
			{#if $store.globalError}
				<span class="text-xs text-error">{$store.globalError}</span>
			{/if}
		</div>

		<Button class="btn-primary" {...$$restProps} isLoading={$store.loading}>
			<Icon data={LibIcon_Add} />
			<p>{textCreate}</p>
		</Button>
	{/if}
</div>
