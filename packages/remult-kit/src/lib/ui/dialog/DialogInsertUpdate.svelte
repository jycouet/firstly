<script lang="ts">
	import { writable } from 'svelte/store'

	import { EachFields, getRepoDisplayValue, LibIcon_Add, LibIcon_Check, LibIcon_Delete } from '../..'
	import { kitCellsBuildor } from '../../kitCellsBuildor'
	import { kitStoreItem } from '../../kitStoreItem'
	import Button from '../Button.svelte'
	import Icon from '../Icon.svelte'
	import { dialog, type DialogMetaDataInternal } from './dialog'
	import DialogPrimitive from './DialogPrimitive.svelte'

	export let toShow: DialogMetaDataInternal
	const cells = kitCellsBuildor(toShow.repo!)(toShow.buildor!)
	const store = kitStoreItem(toShow.repo!)

	$: {
		if (toShow.type === 'update' || toShow.type === 'view') {
			store.set({ item: toShow.defaults, errors: {}, loading: false, globalError: undefined })
		} else {
			store.create(toShow.defaults ?? {})
		}
	}

	let isLoading = false
	const add = async () => {
		isLoading = true
		try {
			const result = await store.save()
			const item = getRepoDisplayValue('dialogInsertUpdate', toShow.repo!, result)

			if (result) {
				dialog.close(toShow.id, { success: true, item })
			}
		} catch (e) {
			// in some cases we don't want to throw.
			// Example: linking ppl to contrat - it is a relation and when adding
			// the same relation it errors on duplicate key. We can ignore it
			if (!toShow.noThrow) {
				throw e
			}
		} finally {
			isLoading = false
		}
	}

	const onDelete = async () => {
		if ((await dialog.confirmDelete('')).success) {
			await store.deleteMe()
			dialog.close(toShow.id, { success: true })
		}
	}

	const dynamicSelector = writable<any>([])

	const getDynamicBuildor = () => {
		const filteredCols = cells.filter((b) => b.filter?.on)
		if (!filteredCols.length) {
			return
		}
		filteredCols.forEach((col) => {
			if (!col) {
				return
			}
			const relatedCol = cells.find((b) => b.col === col.filter?.on)
			if (!relatedCol?.col) {
				return
			}
			if ($store.item[relatedCol.col] && col.filter) {
				const cell = cells.find((c) => c?.field?.key === relatedCol.col)
				if (cell?.field?.options) {
					// @ts-ignore
					col.filter.where = { [cell.field.options.field]: $store.item[cell.field.options.field] }
				}
			}
		})
		$dynamicSelector = [...cells]
	}

	$: $dynamicSelector = cells
	$: $store.item && getDynamicBuildor()
</script>

<DialogPrimitive
	detail={toShow.detail}
	open
	classes={{ root: toShow.classes?.root }}
	on:change={() => dialog.close(toShow.id, { success: false })}
>
	<form on:submit|preventDefault={add}>
		<div class="grid {toShow.classes?.formGrid ?? ''} gap-4 pb-4">
			<EachFields {cells} {store} mode={toShow.type === 'view' ? 'view' : 'edit'} />
		</div>

		<div class="mt-2 flex items-center justify-between">
			{#if toShow.type === 'update'}
				{#if toShow.wDelete}
					<Button
						type="button"
						on:click={onDelete}
						class="btn-outline btn-error mr-4 text-white"
						{isLoading}
					>
						<Icon data={LibIcon_Delete} />
					</Button>
				{/if}

				<div>
					{#if $store.globalError}
						<span class="text-xs text-error">{$store.globalError}</span>
					{/if}
				</div>

				<Button class="text-white" {...$$restProps} {isLoading}>
					<Icon data={LibIcon_Check} />
					<p>Sauvegarder</p>
				</Button>
			{/if}

			{#if toShow.type === 'insert'}
				<div>
					{#if $store.globalError}
						<span class="text-xs text-error">{$store.globalError}</span>
					{/if}
				</div>

				<Button class="text-white" {...$$restProps} {isLoading}>
					<Icon data={LibIcon_Add} />
					<p>Créer</p>
				</Button>
			{/if}
		</div>
	</form>
</DialogPrimitive>
