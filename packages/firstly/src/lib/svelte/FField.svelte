<script lang="ts">
	import { getValueList, type FieldMetadata } from 'remult'

	const default_uid = $props.id()

	interface Props {
		uid?: string
		field: FieldMetadata<any, any>
		value: any
		error?: string
	}

	let { uid = default_uid, field, value = $bindable(), error }: Props = $props()

	let valueList = getValueList(field) as { id: string; caption: string }[] | undefined
</script>

<div data-ff-field class="" style="width: {field.options.ui?.width}%">
	<div data-ff-field-header class="">
		<label data-ff-field-label for={uid} class="">{field.caption}</label>
		{#if error}
			<span data-ff-field-error class="">{error}</span>
		{/if}
	</div>
	{#if valueList}
		<select data-ff-field-select class="" id={uid} bind:value>
			{#each valueList as item (item.id)}
				<option value={item}>{item.caption}</option>
			{/each}
		</select>
	{:else if field.inputType === 'checkbox'}
		<input data-ff-field-checkbox class="" id={uid} type="checkbox" bind:checked={value}  />
	{:else}
		<input data-ff-field-input class="" id={uid} type={field.inputType} bind:value />
	{/if}
</div>
