<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getClasses } from '.'
	import type { CustomFieldDefaultProps } from './customField'
	import type { ErrorTheme } from './ff_Config.svelte'

	const default_uid = $props.id()

	interface Props extends CustomFieldDefaultProps {
		classes?: ErrorTheme
	}

	let { uid = default_uid, field, value, error, classes: localClasses = {} }: Props = $props()

	let classes = $derived(getClasses('error', localClasses))
</script>

<div data-ff-field-error class={classes.root}>{error}</div>
