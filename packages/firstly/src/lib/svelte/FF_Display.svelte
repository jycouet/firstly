<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { type FieldMetadata } from 'remult'

	import { getDynamicCustomField } from './'
	import { isComponentObject } from './customField'

	interface Props {
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
	}

	let { field, value, error }: Props = $props()

	// let valueList = getValueList(field) as { id: string; caption: string }[] | undefined
	const globalCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'display' })
</script>

{#if field.options.ui?.display}
	{@const customField = field.options.ui?.display}
	{#if isComponentObject(customField)}
		{@const Component = customField.component}
		<Component {field} bind:value {error} {...customField.props} />
	{:else}
		{@const Component = customField}
		<Component {field} bind:value {error} />
	{/if}
{:else if globalCustomField}
	{#if isComponentObject(globalCustomField)}
		{@const Component = globalCustomField.component}
		<Component {field} bind:value {error} {...globalCustomField.props} />
	{:else}
		{@const Component = globalCustomField}
		<Component {field} bind:value {error} />
	{/if}
{:else}
	{field.displayValue({ [field.key]: value } as Partial<entityType>)}
{/if}
