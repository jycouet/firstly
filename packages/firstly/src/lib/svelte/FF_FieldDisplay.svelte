<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { type FieldMetadata } from 'remult'

	import { isComponentObject } from './customField'
	import { getDynamicCustomField } from './ff_Config'

	interface Props {
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
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

{#if field.options.ui?.customField?.display}
	{@const customField = field.options.ui?.customField?.display}
	{#if isComponentObject(customField)}
		{@const Component = customField.component}
		<Component {field} bind:value {error} mode="display" {...customField.props} />
	{:else}
		{@const Component = customField}
		<Component {field} bind:value {error} mode="display" />
	{/if}
{:else if globalCustomField}
	{#if isComponentObject(globalCustomField)}
		{@const Component = globalCustomField.component}
		<Component {field} bind:value {error} mode="display" {...globalCustomField.props} />
	{:else}
		{@const Component = globalCustomField}
		<Component {field} bind:value {error} mode="display" />
	{/if}
{:else}
	{field.displayValue({ [field.key]: value } as Partial<entityType>)}
{/if}
