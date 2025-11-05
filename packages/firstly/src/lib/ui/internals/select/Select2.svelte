<script lang="ts">
	import Svelecte from 'svelecte'

	import { LibIcon_Search, type BaseItem } from 'firstly/internals'
	import Icon from 'firstly/ui/Icon.svelte'

	interface Props {
		value?: string | undefined
		clearable?: boolean
		items?: BaseItem[] | undefined
		placeholder?: string | undefined

		onChange?: (value: string | undefined) => void

		multiple?: boolean
	}

	let {
		value = $bindable(undefined),
		clearable = false,
		items = [],
		placeholder = '',
		multiple = false,
		onChange,
	}: Props = $props()
</script>

<Svelecte
	i18n={{
		nomatch: 'Aucun résultat',
	}}
	options={items}
	bind:value
	{clearable}
	{placeholder}
	{multiple}
	{onChange}
>
	{#snippet prepend()}
	{value}
		<Icon data={LibIcon_Search} class="mr-2 ml-3"></Icon>
	{/snippet}

	{#snippet option(opt, inputValue)}
		{@const item = opt as BaseItem}
		<div class="flex items-center">
			<Icon data={item.icon?.data} class="mr-2"></Icon>
			{item.caption}
		</div>
	{/snippet}
</Svelecte>

<style>
	:global(.svelecte) {
		--sv-min-height: 3rem;
		--sv-bg: var(--color-base-100, #fff);
		--sv-disabled-bg: #eee;
		--sv-border: 1px solid #414a54;
		--sv-border-radius: var(--radius-field, 4px);
		--sv-general-padding: 4px;
		--sv-control-bg: var(--sv-bg);
		--sv-item-wrap-padding: 3px 3px 3px 6px;
		--sv-item-selected-bg: var(--color-base-200, #efefef);
		--sv-item-btn-color: var(--color-base-content, #000);
		--sv-item-btn-color-hover: #777; /* same as icon-color-hover in default theme */
		--sv-item-btn-bg: var(--color-base-100, #efefef);
		--sv-item-btn-bg-hover: var(--color-base-200, #ddd);
		--sv-icon-color: var(--color-base-content, #efefef);
		--sv-icon-color-hover: #777;
		--sv-icon-bg: transparent;
		--sv-icon-size: 20px;
		--sv-separator-bg: var(--color-neutral-content, #ccc);
		--sv-btn-border: 0;
		--sv-placeholder-color: #ccccd6;
		--sv-dropdown-bg: var(--sv-bg);
		--sv-dropdown-offset: 1px;
		--sv-dropdown-border: 1px solid rgba(0, 0, 0, 0.15);
		--sv-dropdown-width: auto;
		--sv-dropdown-shadow: 0 6px 12px #0000002d;
		--sv-dropdown-height: 320px;
		--sv-dropdown-active-bg: var(--color-primary, #f2f5f8);
		--sv-dropdown-selected-bg: var(--color-neutral);
		--sv-create-kbd-border: var(--border, 1px) solid var(--color-base-200, #efefef);
		--sv-create-kbd-bg: var(--color-base-100, #fff);
		--sv-create-disabled-bg: var(--color-error, #fcbaba);
		--sv-loader-border: var(--border, 2px) solid var(--color-base-200, #ccc);
	}
</style>
