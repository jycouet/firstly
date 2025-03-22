<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { FF_Edit, FF_Error, FF_Hint, FF_Label, getClasses, type FieldTheme } from './'
	import type { CustomFieldDefaultProps } from './customField'

	const default_uid = $props.id()

	interface Props extends CustomFieldDefaultProps {
		classes?: FieldTheme
	}

	let {
		uid = default_uid,
		field,
		value = $bindable(),
		error,
		classes: localClasses = {},
	}: Props = $props()

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
	<FF_Label {uid} {field} {error} {value} />
	<FF_Error {uid} {field} {error} {value} />
	<FF_Edit {uid} {field} {error} bind:value />
	<FF_Hint {uid} {field} {error} {value} />
</div>

<!-- TODO Ermin Question: This should be in the css of the user ?
 I think it's ok to keep it here. BUT
 Can people then overwrite [data-ff-form-fields] for example ?
 Of it could be our OWN OWN css inthe component ?
-->
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
