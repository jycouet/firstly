<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { Component } from 'svelte'

	import { getValueList, type FieldMetadata } from 'remult'

	import { getDynamicCustomField } from './ff_Config'

	interface Props {
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		// customField?: Component<CustomFieldType<valueType, entityType>>
	}

	let { field, value, error }: Props = $props()

	// let valueList = getValueList(field) as { id: string; caption: string }[] | undefined
	const globalCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'display' })
</script>

{#snippet customFieldEmpty()}
	<div style="border: 1px solid red; padding: 0.4rem; border-radius: 0.5rem;">
		<div style="color: red;">
			You are missing a snippet for "{field.key}"
		</div>
		<div>In the entity directly:</div>
		<pre style="font-size: 12px; background-color: #000000; padding: 0.4rem">{`@Fields.json({
  ui: {
    customField: createCustomField(Map)
  },
})
${field.key} = { lat: 0, lng: 0 }`}</pre>
		<div>Or in a component like this:</div>
		<pre style="font-size: 12px; background-color: #000000; padding: 0.4rem">{`<FF_Form {r}>
  {#snippet customField(fieldgetDynamicCustomField
    {#if field.key === '${field.key}'}
      ...stuff... 
    {/if}
  {/snippet}
</FF_Form>`}</pre>
	</div>
{/snippet}

<!-- {#if customField === true}
	{@render customFieldEmpty()}
{:else if customField} -->
<!-- {@render customField({ field, value, error, mode: 'display' })}
{:else if field.options.ui?.customField?.display === true}
	{@render customFieldEmpty()}
{:else if field.options.ui?.customField?.display}
	{@render field.options.ui?.customField?.display({ field, value, error, mode: 'display' })} -->
{#if field.options.ui?.customField?.edit}
	{@const Component = field.options.ui?.customField?.edit}
	<Component {field} bind:value {error} mode="edit" />
{:else if globalCustomField}
	{@const Component = globalCustomField}
	<Component {field} bind:value {error} mode="edit" />
{:else}
	{field.displayValue({ [field.key]: value } as Partial<entityType>)}
{/if}
