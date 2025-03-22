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
</script>

<div
	data-ff-field
	class={classes.root}
	style:--ff-field-style-width={field.options.ui?.style?.width}
>
	<FF_Label {uid} {field} {error} {value} />
	<FF_Error {uid} {field} {error} {value} />
	<FF_Edit {uid} {field} {error} bind:value />
	<FF_Hint {uid} {field} {error} {value} />
	{JSON.stringify(field.options.ui?.style)}
</div>

<!-- TODO Ermin Question: This should be in the css of the user ?
 I think it's ok to keep it here. BUT
 Can people then overwrite [data-ff-form-fields] for example ?
 Of it could be our OWN OWN css inthe component ?
-->
<style>
	:global {
		[data-ff-field] {
			width: calc(var(--ff-field-style-width, 100) * 1%);
		}

		/* @media (max-width: 768px) {
			[data-ff-field] {
				grid-column-end: var(--ff-field-style-end-mobile);
				grid-column: span var(--ff-field-style-span-mobile) / span var(--ff-field-style-span-mobile);
				grid-column-start: var(--ff-field-style-start-mobile);
			}
		} */

		input[data-ff-field-input] {
			width: 100%;
		}

		select[data-ff-field-select] {
			width: 100%;
		}
	}
</style>
