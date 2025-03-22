<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getClasses } from '.'
	import type { CustomFieldDefaultProps } from './customField'
	import type { HintTheme } from './ff_Config.svelte'

	const default_uid = $props.id()

	interface Props extends CustomFieldDefaultProps {
		classes?: HintTheme
	}

	let { uid = default_uid, field, classes: localClasses = {} }: Props = $props()

	let classes = $derived(getClasses('hint', localClasses))
</script>

<label data-ff-field-label for={uid} class={classes.root}>{field.caption}</label>

{#if field.options.ui?.field?.hint === 'remove'}
	<!-- Nothing -->
{:else if field.options.ui?.field?.hint === 'hide'}
	<div class={classes.root}></div>
{:else}
	<div data-ff-field-label class={classes.root}>{@html field.options.ui?.hint}</div>
{/if}
