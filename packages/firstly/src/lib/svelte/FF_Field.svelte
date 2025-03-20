<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getValueList, type FieldMetadata } from 'remult'

	import type { CustomFieldSnippet } from './createCustomField'
	import { getFieldTheme, type FieldTheme } from './ff_Config'

	const default_uid = $props.id()

	interface Props {
		uid?: string
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		customField?: CustomFieldSnippet<valueType, entityType>

		classes?: FieldTheme
	}

	// Get theme from context or use default
	const themeClasses = getFieldTheme()

	let { uid = default_uid, field, value = $bindable(), error, customField, classes = {} }: Props = $props()

	// Merge provided classes with theme classes
	classes = { ...themeClasses, ...classes }

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

<div
	data-ff-field
	class={classes?.root}
	style:--ff-field-position-span={field.options.ui?.position?.span ?? 12}
	style:--ff-field-position-start={field.options.ui?.position?.start}
	style:--ff-field-position-end={field.options.ui?.position?.end}
	style:--ff-field-position-mobile-span={field.options.ui?.position?.mobile?.span ?? 12}
	style:--ff-field-position-mobile-start={field.options.ui?.position?.mobile?.start}
	style:--ff-field-position-mobile-end={field.options.ui?.position?.mobile?.end}
>
	{#if !field.options.ui?.hide?.header}
		<div data-ff-field-header class={classes?.header}>
			<label data-ff-field-label for={uid} class={classes?.label}>{field.caption}</label>
			{#if error}
				<span data-ff-field-error class={classes?.error}>{error}</span>
			{/if}
		</div>
	{/if}
	{#if valueList}
		<select data-ff-field-select class={classes?.select} id={uid} bind:value>
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
		<input data-ff-field-checkbox class={classes?.checkbox} id={uid} type="checkbox" bind:checked={value as boolean} />
	{:else}
		<input
			autocomplete="off"
			data-ff-field-input
			class={classes?.input}
			id={uid}
			type={field.inputType}
			placeholder={field.options.ui?.placeholder}
			bind:value={() => field.valueConverter.fromInput(value as any),
			(v) => (value = field.valueConverter.toInput(v) as valueType)}
		/>
	{/if}
</div>

<style>
	:global {
		[data-ff-form-fields] {
			display: grid;
			grid-template-columns: repeat(12, minmax(0, 1fr));
			gap: 1rem;
		}

		[data-ff-field] {
			grid-column-end: var(--ff-field-position-end);
			grid-column: span var(--ff-field-position-span) / span var(--ff-field-position-span);
			grid-column-start: var(--ff-field-position-start);
		}

		@media (max-width: 768px) {
			[data-ff-field] {
				grid-column-end: var(--ff-field-position-mobile-end);
				grid-column: span var(--ff-field-position-mobile-span) / span
					var(--ff-field-position-mobile-span);
				grid-column-start: var(--ff-field-position-mobile-start);
			}
		}

		input[data-ff-field-input] {
			width: 100%;
		}

		select[data-ff-field-select] {
			width: 100%;
		}
	}
</style>
