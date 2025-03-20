<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getValueList, type FieldMetadata } from 'remult'

	import type { CustomFieldSnippet } from './createCustomField'

	interface Props {
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		customField?: CustomFieldSnippet<valueType, entityType>
	}

	let { field, value, error, customField }: Props = $props()

	let valueList = getValueList(field) as { id: string; caption: string }[] | undefined
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
  {#snippet customField(field, value)}
    {#if field.key === '${field.key}'}
      ...stuff... 
    {/if}
  {/snippet}
</FF_Form>`}</pre>
	</div>
{/snippet}

{#if valueList}
	{field.displayValue({ [field.key]: value } as Partial<entityType>)}
{:else if customField === true}
	{@render customFieldEmpty()}
{:else if customField}
	{@render customField({ field, value, error })}
{:else if field.options.ui?.customField === true}
	{@render customFieldEmpty()}
{:else if field.options.ui?.customField}
	{@render field.options.ui?.customField({ field, value, error })}
{:else}
	{field.displayValue({ [field.key]: value } as Partial<entityType>)}
{/if}
