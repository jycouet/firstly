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

{#if field.options.ui?.component?.error === undefined || field.options.ui?.component?.error === 'show'}
	<div data-ff-field-error class={classes.root}>{@html error}</div>
{:else if field.options.ui?.component?.error === 'remove'}
	<!-- Nothing -->
{:else if field.options.ui?.component?.error === 'hide'}
	<span class={classes.root}></span>
{/if}
