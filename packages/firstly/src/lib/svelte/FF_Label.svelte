<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getClasses } from './'
	import type { CustomFieldDefaultProps } from './customField'
	import type { LabelTheme } from './ff_Config.svelte'

	const default_uid = $props.id()

	interface Props extends CustomFieldDefaultProps {
		classes?: LabelTheme
	}

	let { uid = default_uid, field, classes: localClasses = {} }: Props = $props()

	let classes = $derived(getClasses('label', localClasses))
</script>

{#if field.options.ui?.component?.label === undefined || field.options.ui?.component?.label === 'show'}
	<label data-ff-field-label for={uid} class={classes.root}>{@html field.caption}</label>
{:else if field.options.ui?.component?.label === 'remove'}
	<!-- Nothing -->
{:else if field.options.ui?.component?.label === 'hide'}
	<span class={classes.root}></span>
{/if}
