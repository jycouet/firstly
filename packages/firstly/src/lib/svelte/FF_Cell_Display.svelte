<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getClasses, getDynamicCustomField, type DisplayTheme } from '.'
	import { isComponentObject, type CustomFieldDefaultProps } from './customField'

	interface Props extends CustomFieldDefaultProps {
		classes?: DisplayTheme
	}

	let { field, value, error, classes: localClasses = {} }: Props = $props()

	// let valueList = getValueList(field) as { id: string; caption: string }[] | undefined

	let classes = $derived(getClasses('display', localClasses))
	const dynamicCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'display' })
</script>

{#if field.options.ui?.component?.display}
	{@const customField = field.options.ui?.component?.display}
	{#if isComponentObject(customField)}
		{@const Component = customField.component}
		<Component {field} bind:value {error} {...customField.props} />
	{:else}
		{@const Component = customField}
		<Component {field} bind:value {error} />
	{/if}
{:else if dynamicCustomField}
	{#if isComponentObject(dynamicCustomField)}
		{@const Component = dynamicCustomField.component}
		<Component {field} bind:value {error} {...dynamicCustomField.props} />
	{:else}
		{@const Component = dynamicCustomField}
		<Component {field} bind:value {error} />
	{/if}
{:else if field.inputType === 'checkbox'}
	<input
		disabled
		data-ff-display-checkbox
		class={classes?.checkbox}
		type="checkbox"
		checked={value as boolean}
	/>
{:else if field.displayValue}
	<div data-ff-display>
		{field.displayValue({ [field.key]: value } as Partial<entityType>)}
	</div>
{:else}
	<div data-ff-display>
		{value} NOT READY JYC!
	</div>
{/if}

<style>
	[data-ff-display-checkbox] {
		display: block;
		margin: 0 auto;
	}

	[data-ff-display] {
		min-height: 20px;
	}
</style>
