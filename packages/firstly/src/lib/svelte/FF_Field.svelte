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
	style:--ff-field-style-span={field.options.ui?.style?.span}
	style:--ff-field-style-start={field.options.ui?.style?.start}
	style:--ff-field-style-span-mobile={field.options.ui?.style?.mobile?.span}
	style:--ff-field-style-start-mobile={field.options.ui?.style?.mobile?.start}
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
		[data-ff-field] {
			grid-column: span var(--ff-field-style-span, 12) / span var(--ff-field-style-span, 12);
			grid-column-start: var(--ff-field-style-start);
		}

		@media (max-width: 768px) {
			[data-ff-field] {
				grid-column: span var(--ff-field-style-span-mobile, 12) / span
					var(--ff-field-style-span-mobile, 12);
				grid-column-start: var(--ff-field-style-start-mobile);
			}
		}
	}
</style>
