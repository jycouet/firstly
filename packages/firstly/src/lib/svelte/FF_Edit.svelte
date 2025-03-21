<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getValueList, type FieldMetadata } from 'remult'

	import { getClasses, getDynamicCustomField } from '.'
	import { isComponentObject } from './customField'
	import type { EditTheme } from './ff_Config'

	const default_uid = $props.id()

	interface Props {
		uid?: string
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		classes?: EditTheme
	}

	let {
		uid = default_uid,
		field,
		value = $bindable(),
		error,
		// customField,
		classes: localClasses = {},
	}: Props = $props()

	let classes = $derived(getClasses('edit', localClasses))

	let valueList = getValueList(field) as { id: string; caption: string }[] | undefined
	const globalCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'edit' })
</script>

{#if field.options.ui?.customField?.edit}
	{@const customField = field.options.ui?.customField?.edit}
	{#if isComponentObject(customField)}
		{@const Component = customField.component}
		<Component {field} bind:value {error} mode="edit" {...customField.props} />
	{:else}
		{@const Component = customField}
		<Component {field} bind:value {error} mode="edit" />
	{/if}
{:else if globalCustomField}
	{#if isComponentObject(globalCustomField)}
		{@const Component = globalCustomField.component}
		<Component {field} bind:value {error} mode="edit" {...globalCustomField.props} />
	{:else}
		{@const Component = globalCustomField}
		<Component {field} bind:value {error} mode="edit" />
	{/if}
{:else if valueList}
	<select data-ff-field-select class={classes?.select} id={uid} bind:value>
		{#each valueList as item (item.id)}
			<option value={item}>{item.caption}</option>
		{/each}
	</select>
{:else if field.inputType === 'checkbox'}
	<input
		data-ff-field-checkbox
		class={classes?.checkbox}
		id={uid}
		type="checkbox"
		bind:checked={value as boolean}
	/>
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
