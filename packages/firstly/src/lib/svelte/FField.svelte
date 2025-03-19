<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getValueList, type FieldMetadata } from 'remult'

	import type { CustomFieldSnippet } from './createCustomField'

	const default_uid = $props.id()

	interface Props {
		uid?: string
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		customField?: CustomFieldSnippet<valueType, entityType>
	}

	let { uid = default_uid, field, value = $bindable(), error, customField }: Props = $props()

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
		<pre style="font-size: 12px; background-color: #000000; padding: 0.4rem">{`<FForm {r}>
  {#snippet customField(field, value)}
    {#if field.key === '${field.key}'}
      ...stuff... 
    {/if}
  {/snippet}
</FForm>`}</pre>
	</div>
{/snippet}

<div data-ff-field class="" style="width: {field.options.ui?.width ?? 100}%">
	{#if !field.options.ui?.hide?.header}
		<div data-ff-field-header class="">
			<label data-ff-field-label for={uid} class="">{field.caption}</label>
			{#if error}
				<span data-ff-field-error class="">{error}</span>
			{/if}
		</div>
	{/if}
	{#if valueList}
		<select data-ff-field-select class="" id={uid} bind:value>
			{#each valueList as item (item.id)}
				<option value={item}>{item.caption}</option>
			{/each}
		</select>
	{:else if customField === true}
		{@render customFieldEmpty()}
	{:else if customField}
		{@render customField({ field, value, error })}
	{:else if field.options.ui?.customField === true}
		{@render customFieldEmpty()}
	{:else if field.options.ui?.customField}
		{@render field.options.ui?.customField({ field, value, error })}
	{:else if field.inputType === 'checkbox'}
		<input data-ff-field-checkbox class="" id={uid} type="checkbox" bind:checked={value as boolean} />
	{:else}
		<input
			autocomplete="off"
			data-ff-field-input
			class=""
			id={uid}
			type={field.inputType}
			placeholder={field.options.ui?.placeholder}
			bind:value
		/>
	{/if}
</div>
