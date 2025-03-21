<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { type FieldMetadata } from 'remult'

	import { FF_Edit, getClasses, type FieldTheme } from './'

	const default_uid = $props.id()

	interface Props {
		uid?: string
		field: FieldMetadata<valueType, entityType>
		value: valueType
		error?: string
		classes?: FieldTheme
	}

	let {
		uid = default_uid,
		field,
		value = $bindable(),
		error,
		classes: localClasses = {},
	}: Props = $props()

	// Get merged classes from the theme context
	let classes = $derived(getClasses('field', localClasses))
	// getDynamicCustom OPTIONS
	// const globalCustomField = getDynamicCustomField()?.({ field, value, error, mode: 'edit' })
</script>

<div
	data-ff-field
	class={classes.root}
	style:--ff-field-position-span={field.options.ui?.position?.span ?? 12}
	style:--ff-field-position-start={field.options.ui?.position?.start}
	style:--ff-field-position-end={field.options.ui?.position?.end}
	style:--ff-field-position-mobile-span={field.options.ui?.position?.mobile?.span ?? 12}
	style:--ff-field-position-mobile-start={field.options.ui?.position?.mobile?.start}
	style:--ff-field-position-mobile-end={field.options.ui?.position?.mobile?.end}
>
	{#if !field.options.ui?.hide?.header}
		<div data-ff-field-header class={classes?.header}>
			<label data-ff-field-label for={uid} class={classes.label}>{field.caption}</label>
			{#if error}
				<span data-ff-field-error class={classes.error}>{error}</span>
			{/if}
		</div>
	{/if}

	<FF_Edit {field} bind:value {error} />
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
