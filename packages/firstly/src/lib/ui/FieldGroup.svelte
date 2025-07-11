<script lang="ts" generics="T extends Record<any, any>">
	import { createEventDispatcher } from 'svelte'

	import type { FieldMetadata } from 'remult'
	import { getRelationFieldInfo } from 'remult/internals'

	import { tw, type StoreItem } from '../internals'
	import type { Cell } from '../internals/cellsBuildor'
	import Field from './Field.svelte'
	import FieldContainer from './internals/FieldContainer.svelte'
	import Loading from './Loading.svelte'

	type Mode = 'edit' | 'view' | 'filtre'
	export let mode: Mode = 'edit'

	export let cells: Cell<T>[]
	export let store: StoreItem<T>

	export let focusKey: string | null | undefined = null
	export let createRequest: ((args: { input: string; id: string }) => void) | undefined = undefined

	const getError = (errors: any, field: FieldMetadata<any, any>) => {
		const fo = getRelationFieldInfo(field)
		const keyToUse = fo?.options?.field
		if (errors && keyToUse && errors[keyToUse]) {
			return errors[keyToUse]
		} else if (errors && errors[field.key]) {
			return errors[field.key]
		}
		return undefined
	}

	const shouldHide = (c: Cell<T>, mode: Mode) => {
		if (mode === 'edit' && c.modeEdit === 'hide') {
			return true
		}
		if (mode === 'view' && c.modeView === 'hide') {
			return true
		}
		return false
	}

	const modeToUse = (c: Cell<T>, mode: Mode) => {
		if (mode === 'edit' && c.modeEdit === 'view') {
			return 'view'
		}
		if (mode === 'view' && c.modeView === 'edit') {
			return 'edit'
		}
		return mode
	}

	const dispatch = createEventDispatcher()

	function dispatchChanged(_data: T | undefined) {
		dispatch('changed', _data)
	}

	$: dispatchChanged($store.item)

	let size = ['', 'w-1/2', 'w-1/3', 'w-1/4', 'w-1/5', 'w-1/6']

	function isToFocus(
		currentKey: string | undefined,
		focusKey: string | null | undefined,
		i: number,
	): boolean {
		if (focusKey === null || focusKey === undefined) {
			if (i === 0) {
				return true
			}
			return false
		}
		return focusKey === currentKey
	}
</script>

{#each cells as cell, i}
	{@const focus = isToFocus(cell.field?.key, focusKey, i)}
	{#if shouldHide(cell, mode)}
		<!-- Do nothing -->
	{:else if cell.field && !cell.field.includedInApi($store.item)}
		<!-- Do nothing, but keep the class... -->
		<div class={cell.class}></div>
	{:else}
		<div class={cell.class}>
			{#if cell.kind === 'header'}
				<span>{cell.header}</span>
			{:else if cell.field && (!$store || $store.loading)}
				<!-- If the store is not ready mdiYeast, or in loading... -->
				<FieldContainer label={cell.field.caption} forId={cell.field.key}>
					<Loading
						class={tw(
							`mx-4 my-3 h-6`,
							size[parseInt((((i + 1) * Math.random() * size.length) % size.length).toString())],
						)}
					/>
				</FieldContainer>
			{:else if cell.kind === 'slot'}
				<slot name="field" field={cell.field} {focus} />
			{:else if cell.field && $store.item}
				<Field
					mode={modeToUse(cell, mode)}
					{cell}
					cellsValues={$store.item}
					bind:value={$store.item[cell.field.key]}
					error={getError($store.errors, cell.field)}
					{focus}
					{createRequest}
				/>
				<!-- disabled={isDisableFieldDynamic(cell)} -->
			{:else}
				FieldGroup : Case not handled
			{/if}
		</div>
	{/if}
{/each}
