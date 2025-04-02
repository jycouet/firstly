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
	style:--width={field.options.ui?.width}
	style:--margin-left={field.options.ui?.marginLeft}
	style:--margin-right={field.options.ui?.marginRight}
	style:--width-mobile={field.options.ui?.mobile?.width}
	style:--margin-left-mobile={field.options.ui?.mobile?.marginLeft}
	style:--margin-right-mobile={field.options.ui?.mobile?.marginRight}
>
	<FF_Label {uid} {field} {error} {value} />
	<FF_Error {uid} {field} {error} {value} />
	<FF_Edit {uid} {field} {error} bind:value />
	<FF_Hint {uid} {field} {error} {value} />
</div>

<style>
	[data-ff-field] {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		flex: 1 1 calc(var(--width, 100) * 1%);
		max-width: calc(var(--width, 100) * 1%);
		padding: var(--ff-spacing);
		margin-left: calc(var(--margin-left, 0) * 1%);
		margin-right: calc(var(--margin-right, 0) * 1%);

		/* For debugging purposes - outline that doesn't affect layout */
		/* outline: 1px solid rgba(255, 0, 0, 0.5);
		outline-offset: -1px; */
	}

	@media screen and (max-width: 40rem) {
		[data-ff-field] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--margin-left-mobile, 0) * 1%);
			margin-right: calc(var(--margin-right-mobile, 0) * 1%);
		}
	}
</style>
