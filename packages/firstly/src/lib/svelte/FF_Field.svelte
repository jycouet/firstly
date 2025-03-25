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
	style:--width={field.options.ui?.style?.width}
	style:--width-left={field.options.ui?.style?.widthLeft}
	style:--width-right={field.options.ui?.style?.widthRight}
	style:--width-mobile={field.options.ui?.style?.mobile?.width}
	style:--width-mobile-left={field.options.ui?.style?.mobile?.widthLeft}
	style:--width-mobile-right={field.options.ui?.style?.mobile?.widthRight}
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
		margin-left: calc(var(--width-left, 0) * 1%);
		margin-right: calc(var(--width-right, 0) * 1%);

		/* For debugging purposes - outline that doesn't affect layout */
		/* outline: 1px solid rgba(255, 0, 0, 0.5);
		outline-offset: -1px; */
	}

	@media screen and (max-width: 64rem) {
		[data-ff-field] {
			flex: 1 1 calc(var(--width-tablet, 100) * 1%);
			max-width: calc(var(--width-tablet, 100) * 1%);
			margin-left: calc(var(--width-tablet-left, 0) * 1%);
			margin-right: calc(var(--width-tablet-right, 0) * 1%);
		}
	}

	@media screen and (max-width: 40rem) {
		[data-ff-field] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--width-mobile-left, 0) * 1%);
			margin-right: calc(var(--width-mobile-right, 0) * 1%);
		}
	}
</style>
