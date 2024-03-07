<script lang="ts">
	import { createCombobox, createSync, type ComboboxOptionProps } from '@melt-ui/svelte'
	import { createEventDispatcher, onMount } from 'svelte'
	import { fly } from 'svelte/transition'

	import {
		LibIcon_Check,
		LibIcon_ChevronDown,
		LibIcon_ChevronUp,
		LibIcon_Cross,
		LibIcon_Search,
		tw,
		type KitBaseItem,
		type KitIcon,
	} from '../../../'
	import Icon from '../../Icon.svelte'

	export let id: string
	export let disabled: boolean = false
	export let placeholder: string = ''
	export let items: KitBaseItem[] = []

	export let loadOptions: ((str: string) => Promise<KitBaseItem[]>) | undefined = undefined
	// export let selectedItem: CreateComboboxProps<KitBaseItem>['defaultSelected'] = undefined
	export let value: string | undefined = undefined
	export let clearable = false

	const dispatch = createEventDispatcher()

	function dispatchSelectedValue(_data: KitBaseItem | undefined) {
		dispatch('selected', _data)
	}

	onMount(async () => {
		if (loadOptions) {
			items = await loadOptions('')
		}

		// after we load items
		sync.selected(getDefaultValue(value))
	})

	const getDefaultValue = (_selectedValue: string | undefined) => {
		if (!items) {
			return
		}
		const found = items.find((c) => String(c.id) === String(_selectedValue))
		if (found) {
			return toOption(found)
		}
	}

	const toOption = (
		item: KitBaseItem,
	): ComboboxOptionProps<KitBaseItem> & {
		icon?: KitIcon
	} => ({
		value: item,
		label: item.caption,
		// icon: item.icon,
		// disabled: item.disabled,
	})

	const {
		elements: { menu, input, option },
		states: { open, inputValue, touchedInput, selected: localSelected },
		helpers: { isSelected },
	} = createCombobox<KitBaseItem>({
		forceVisible: true,
		disabled,
		ids: { label: id },
	})

	const clearSelection = () => {
		sync.selected(undefined)
	}

	let debounceTimer: ReturnType<typeof setTimeout>
	const debounce = (callback: () => void) => {
		clearTimeout(debounceTimer)
		debounceTimer = setTimeout(
			callback,
			// debounce only if we have a load option
			loadOptions ? 444 : 0,
		)
	}

	const sync = createSync({ selected: localSelected })
	$: items &&
		sync.selected(getDefaultValue(value), (v) => {
			// Only if different
			if (v?.value?.id !== value) {
				dispatchSelectedValue(v?.value)
			}
			value = v?.value?.id
		})

	$: if (!$open) {
		$inputValue = $localSelected?.label ?? ''
	}

	let filteredItems = items
	$: {
		if ($touchedInput) {
			debounce(async () => {
				const normalizedInput = $inputValue.toLowerCase()
				if (loadOptions) {
					filteredItems = await loadOptions(normalizedInput)
				} else {
					filteredItems = items.filter((item) => {
						return item.caption?.toLowerCase().includes(normalizedInput)
					})
				}
			})
		} else {
			filteredItems = items
		}
	}
</script>

<div class="input input-bordered flex min-w-0 items-center {disabled && 'opacity-40'}">
	<div class="relative">
		{#if $localSelected?.value?.icon?.data}
			<Icon
				data={$localSelected.value.icon.data}
				class={tw(['relative', $localSelected.value.icon.class])}
				style={$localSelected.value.icon.style}
				size={$localSelected.value.icon.size}
			></Icon>
		{:else}
			<Icon data={LibIcon_Search} class="relative"></Icon>
		{/if}
	</div>
	<!-- {id} -->
	<input
		{...$input}
		use:$input.action
		class="-mx-8 h-full min-w-0 flex-grow bg-transparent px-10"
		{placeholder}
	/>
	<div class="pointer-events-none relative right-0 flex gap-2">
		{#if clearable && $localSelected}
			<button on:click={clearSelection} class="pointer-events-auto">
				<Icon data={LibIcon_Cross}></Icon>
			</button>
		{/if}
		{#if $open}
			<Icon data={LibIcon_ChevronUp}></Icon>
		{:else}
			<Icon data={LibIcon_ChevronDown}></Icon>
		{/if}
	</div>
</div>

{#if $open}
	<ul
		class="z-50 flex max-h-[300px] flex-col overflow-hidden rounded-lg border border-base-content/20"
		{...$menu}
		use:$menu.action
		transition:fly={{ duration: 150, y: -5 }}
	>
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div class="flex max-h-full flex-col gap-0 overflow-y-auto bg-base-100 py-2" tabindex="0">
			{#each filteredItems as item, index (index)}
				<li
					{...$option(toOption(item))}
					use:$option.action
					class="relative flex cursor-pointer scroll-my-2 items-center rounded-md px-1
          py-2
          data-[highlighted]:bg-primary
          data-[highlighted]:text-primary-content
					data-[disabled]:opacity-50"
				>
					{#if $localSelected?.value?.id === item.id}
						<Icon data={LibIcon_Check} class="w-6"></Icon>
					{:else}
						<!-- just to book the place -->
						<span class="w-6"></span>
					{/if}
					{#if item.icon?.data}
						<Icon
							data={item.icon.data}
							class={tw(['flex-shrink-0', item.icon.class])}
							style={item.icon.style}
							size={item.icon.size}
						></Icon>
					{/if}
					<div class="pl-2">
						<span class="font-medium">{item.caption}</span>
					</div>
				</li>
			{:else}
				<li class="relative cursor-pointer rounded-md py-1 pl-8 pr-4">Aucun résultat</li>
			{/each}
		</div>
	</ul>
{/if}
