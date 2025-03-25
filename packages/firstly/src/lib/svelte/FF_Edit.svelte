<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getValueList, type FieldMetadata } from 'remult'

	import { getClasses, getDynamicCustomField } from '.'
	import type { EditTheme } from './'
	import { isComponentObject } from './customField'

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

	let valueList = getValueList(field) as { id: string; caption: string }[] | undefined

	let classes = $derived(getClasses('edit', localClasses))
	const dynamicCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'edit' })
</script>

{#if field.options.ui?.field?.edit}
	{@const customField = field.options.ui?.field?.edit}
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
{:else if valueList}
	<select data-ff-edit-select class={classes?.select} id={uid} bind:value>
		{#each valueList as item (item.id)}
			<option value={item}>{item.caption}</option>
		{/each}
	</select>
{:else if field.inputType === 'checkbox'}
	<div style="display: flex; align-items: center; height: 3rem;">
		<input
			data-ff-edit-checkbox
			class={classes?.checkbox}
			id={uid}
			type="checkbox"
			bind:checked={value as boolean}
		/>
	</div>
{:else}
	<input
		autocomplete="off"
		data-ff-edit-input
		class={classes?.input}
		id={uid}
		type={field.inputType}
		placeholder={field.options.ui?.placeholder}
		bind:value={() => field.valueConverter.fromInput(value as any),
		(v) => (value = field.valueConverter.toInput(v) as valueType)}
	/>
{/if}

<style>
	input[data-ff-edit-input] {
		width: 100%;
	}

	select[data-ff-edit-select] {
		width: 100%;
	}
</style>
