<script lang="ts" generics="T extends Record<any, any>">
	import { createEventDispatcher } from 'svelte'
	import type { HTMLInputAttributes } from 'svelte/elements'

	import { type FieldMetadata, type FindOptions } from 'remult'

	import { suffixWithS } from '../formats/strings'
	import { type BaseItem, type Cell } from '../internals'
	import {
		displayWithDefaultAndSuffix,
		getEntityDisplayValue,
		getFieldMetaType,
		getFirstInterestingField,
		type MetaTypeRelation,
	} from '../internals/helper.js'
	import { tw } from '../utils/tailwind'
	import Clipboardable from './Clipboardable.svelte'
	import Icon from './Icon.svelte'
	import FieldContainer from './internals/FieldContainer.svelte'
	import Input from './internals/Input.svelte'
	import MultiSelectMelt from './internals/select/MultiSelectMelt.svelte'
	import SelectMelt from './internals/select/SelectMelt.svelte'
	import SelectRadio from './internals/select/SelectRadio.svelte'
	import Textarea from './internals/Textarea.svelte'
	import { LibIcon_Eye, LibIcon_EyeOff } from './LibIcon'
	import LinkPlus from './link/LinkPlus.svelte'

	export let cell: Cell<T>
	export let value: HTMLInputAttributes['value'] = undefined

	// values of other fields in same context e.g. in form
	export let cellsValues: any = {}

	export let withDedounce: boolean = false

	export let error = ''

	export let mode: 'edit' | 'view' | 'filtre' = 'edit'

	export let focus: boolean = false

	export let clearable: boolean | undefined = undefined
	export let disabled = false
	export let createRequest: ((args: { input: string; id: string }) => void) | undefined = undefined

	const dispatch = createEventDispatcher()

	function dispatchSelected(_data: BaseItem | BaseItem[] | undefined) {
		value = _data
		dispatch('selected', _data)
	}
	$: metaType = getFieldMetaType(cell.field!, mode === 'filtre')

	const isViewMode = (_mode: 'edit' | 'view' | 'filtre', _field?: FieldMetadata<any, any>) => {
		return _mode === 'view' || _field?.dbReadOnly || _field?.options.allowApiUpdate === false
	}

	const common = (_field?: FieldMetadata<any, any>, isLight = false) => {
		let toRet = {
			id: _field?.key ?? 'SOMETHING_AT_LEAST',
			disabled: _field?.dbReadOnly || _field?.options.allowApiUpdate === false || disabled,
			placeholder: _field?.options?.placeholder ?? undefined,
		}
		if (isLight) {
			return toRet
		}
		return {
			...toRet,
			step: _field?.options?.step ?? undefined,
			name: _field?.key,
			// required: _field?.allowNull === false,
		}
	}

	const toInput = (_metadata?: FieldMetadata<any, any>, _value?: HTMLInputAttributes['value']) => {
		try {
			return _metadata?.valueConverter.toInput(_value, metaType.subKind)
		} catch (error) {
			console.error(`error toInput w field '${_metadata?.key}'`, error)
		}
	}

	const fromInput = (_metadata: FieldMetadata<any, any>, _value: HTMLInputAttributes['value']) => {
		try {
			// REMULT default for numbers ?
			if (_metadata.allowNull && _value === null) {
				return null
			}
			return _metadata?.valueConverter.fromInput(_value, metaType.subKind)
		} catch (error) {
			console.error(`error fromInput w field '${_metadata.key}'`, error)
		}
	}

	// let items: any[] = []

	const getId = () => {
		return value?.id || value
	}

	const getLoadOptions = async (cellsValues: any, str: string) => {
		if (metaType.kind !== 'relation') {
			return { items: [], totalCount: 0 }
		}
		// To make TS happy
		const metaTypeObj = { ...metaType } as MetaTypeRelation

		let findToUse: FindOptions<any> = {}
		if (metaTypeObj.repoTarget.metadata.options.searchableFind) {
			// narrowFind at the end because searchableFind should not change the narrowed part!
			findToUse = metaTypeObj.repoTarget.metadata.options.searchableFind(str)
		} else {
			if (str) {
				const field = getFirstInterestingField(metaTypeObj.repoTarget)
				findToUse = { where: { [field.key]: { $contains: str } } }
			}
		}

		const foEdit = cell.field?.options.findOptionsForEdit
		const narrowFindEditWhere =
			typeof foEdit === 'function'
				? (foEdit(cellsValues).where ?? {})
				: typeof foEdit === 'object'
					? (foEdit.where ?? {})
					: {}

		// @ts-ignore
		const foCrud = cell.field?.options.findOptions
		const narrowFindCrudWhere =
			typeof foCrud === 'function'
				? (foCrud().where ?? {})
				: typeof foCrud === 'object'
					? (foCrud.where ?? {})
					: {}

		findToUse = {
			include: { ...(findToUse.include ?? {}) },
			where: { $and: [findToUse.where, narrowFindEditWhere, narrowFindCrudWhere] },
		}

		// 24 here is a "magic number"!
		let limit = cell.field?.options.findOptionsLimit ?? 24

		const arr = []
		arr.push(
			...(await metaTypeObj.repoTarget.find({
				...findToUse,
				limit,
			})),
		)

		let totalCount = arr.length
		// If we are at the limit... there is probably more! How many?
		if (totalCount === limit) {
			const agg = await metaTypeObj.repoTarget.aggregate({ where: findToUse.where })
			totalCount = agg.$count
		}

		if (!cell.field?.options.multiSelect) {
			// let's get the current item if it's not in the default list (only when there is no searchFilter going on)
			if (str === '' && getId() && !arr.find((r) => String(r.id) === String(getId()))) {
				arr.unshift(await metaTypeObj.repoTarget.findId(getId()))
			}
		}

		return { items: arr.map((r) => getEntityDisplayValue(metaTypeObj.repoTarget, r)), totalCount }
	}

	const getMultiValues = (value: any) => {
		return (value ?? []).map((c: any) => c.id) || value
	}

	const calcSuffix = (value: any) => {
		if (cell.field?.options.suffixEdit) {
			if (cell.field?.options.suffixEditWithS) {
				return suffixWithS(value, cell.field?.options.suffixEdit)
			} else {
				return cell.field?.options.suffixEdit
			}
		}

		if (cell.field?.options.suffix) {
			if (cell.field?.options.suffixWithS) {
				return suffixWithS(value, cell.field?.options.suffix)
			} else {
				return cell.field?.options.suffix
			}
		}

		return ''
	}

	let textpsdVisible = false
</script>

<FieldContainer
	forId={cell.field?.key ?? ''}
	label={cell?.header ?? cell.field?.caption ?? cell.field?.key}
	required={!cell.field?.allowNull && mode === 'edit' && metaType.subKind !== 'checkbox'}
	{error}
	classes={{ slot: metaType.subKind === 'textarea' ? 'h-24 items-start' : '' }}
>
	{@const clearableComputed =
		cell.clearable || clearable || (mode === 'filtre' && clearable === undefined)}
	{#if isViewMode(mode, cell.field)}
		<span class="input-bordered flex items-center pl-2 pr-4">
			{#if cell.field?.inputType === 'checkbox'}
				<input type="checkbox" {...common(cell.field)} class="checkbox ml-2" disabled checked={value} />
			{:else if metaType.kind === 'relation'}
				{@const item = getEntityDisplayValue(metaType.repoTarget, value)}
				<div class={tw('flex items-center gap-4', 'h-12', 'pl-2')}>
					<LinkPlus {item}></LinkPlus>
				</div>
			{:else if metaType.kind === 'enum'}
				{@const v = displayWithDefaultAndSuffix(cell.field, value)}
				<div class="ml-2 flex h-12 items-center gap-4">
					{#if value?.icon}
						<Icon {...value.icon} />
					{/if}
					<Clipboardable value={v}>{v}</Clipboardable>
				</div>
			{:else}
				{@const v = displayWithDefaultAndSuffix(cell.field, value)}
				<div
					class="ml-2 flex h-12 w-full items-center {metaType.subKind === 'number' ? 'justify-end' : ''}"
				>
					<Clipboardable value={v}>{v}</Clipboardable>
				</div>
			{/if}
		</span>
	{:else if metaType.kind === 'relation'}
		{#if metaType.field.options.multiSelect}
			<MultiSelectMelt
				{...common(cell.field, true)}
				clearable={clearableComputed}
				loadOptions={async (str) => await getLoadOptions(cellsValues, str)}
				values={value}
				on:selected={(e) => dispatchSelected(e.detail)}
			/>
		{:else}
			<!-- {items} -->
			<SelectMelt
				{focus}
				{...common(cell.field, true)}
				clearable={clearableComputed}
				loadOptions={async (str) => await getLoadOptions(cellsValues, str)}
				value={value?.id || value}
				on:selected={(e) => dispatchSelected(e.detail)}
				on:issue={(e) => {
					error = e.detail
				}}
				createOptionWhenNoResult={!!cell.field?.options.createOptionWhenNoResult}
				{createRequest}
				default_select_if_one_item={!!cell.field?.options.default_select_if_one_item}
			/>
		{/if}
	{:else if metaType.kind === 'enum'}
		{#if metaType.field.options.multiSelect || metaType.subKind === 'multi'}
			<MultiSelectMelt
				{...common(cell.field, true)}
				clearable={clearableComputed}
				items={metaType.values}
				values={getMultiValues(value)}
				on:selected={(e) => {
					dispatchSelected(e.detail)
				}}
			/>
		{:else if metaType.values.length <= (cell.field?.options.styleRadioUntil ?? 3) && !clearableComputed}
			<SelectRadio
				{...common(cell.field, true)}
				items={metaType.values}
				value={value?.id || value}
				on:selected={(e) => dispatchSelected(e.detail)}
			/>
		{:else}
			<SelectMelt
				{focus}
				{...common(cell.field, true)}
				clearable={clearableComputed}
				items={metaType.values}
				value={value?.id || value}
				on:selected={(e) => dispatchSelected(e.detail)}
				on:issue={(e) => {
					error = e.detail
				}}
			/>
		{/if}
	{:else if metaType.subKind === 'checkbox'}
		<div class="grid content-center items-center pl-4">
			<input
				type="checkbox"
				{...{ ...common(cell.field), required: undefined }}
				class="checkbox"
				checked={value}
				on:input={(e) => {
					// @ts-ignore
					value = e.target.checked
					dispatchSelected(value)
				}}
			/>
		</div>
	{:else if metaType.subKind === 'text' || metaType.subKind === 'email' || metaType.subKind === 'password' || metaType.subKind === 'dateOnly' || metaType.subKind === 'number' || metaType.subKind === 'textpsd'}
		<div class="input input-bordered inline-flex w-full items-center pl-2">
			<Input
				{focus}
				{...common(cell.field)}
				autocomplete="off"
				class={tw(
					`join-item w-full bg-transparent placeholder:text-base-content/30`,
					metaType.subKind === 'number' && 'text-end',
				)}
				style={cell.field?.inputType === 'textpsd' && textpsdVisible === false
					? 'filter: blur(0.2rem)'
					: ''}
				type={metaType.subKind.replaceAll('dateOnly', 'date').replaceAll('textpsd', 'text')}
				value={toInput(cell.field, value)}
				{withDedounce}
				on:input={(e) => {
					// @ts-ignore
					value = fromInput(cell.field, e.detail.value)
					dispatchSelected(value)
				}}
				{...$$restProps}
			/>
			{calcSuffix(value)}
			{#if cell.field?.inputType === 'textpsd'}
				<button
					on:click={(e) => {
						e.preventDefault()
						textpsdVisible = !textpsdVisible
					}}
					class="btn-ghost btn-sm"
				>
					<Icon data={textpsdVisible ? LibIcon_Eye : LibIcon_EyeOff} />
				</button>
			{/if}
		</div>
	{:else if metaType.subKind === 'textarea'}
		<Textarea
			{focus}
			{...common(cell.field)}
			value={toInput(cell.field, value)}
			on:input={(e) => {
				// @ts-ignore
				value = fromInput(cell.field, e.detail.value)
			}}
		/>
	{:else}
		<!-- This shoud NEVER be displayed -->
		<span class="flex items-center pl-2 text-error">Type "{cell.field?.inputType}" not managed!</span>
	{/if}
</FieldContainer>
