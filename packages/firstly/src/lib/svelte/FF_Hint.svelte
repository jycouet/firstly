<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { getClasses } from '.'
	import type { CustomFieldDefaultProps } from './customField'
	import type { HintTheme } from './ff_Config.svelte'

	interface Props extends CustomFieldDefaultProps {
		classes?: HintTheme
	}

	let { field, classes: localClasses = {} }: Props = $props()

	let classes = $derived(getClasses('hint', localClasses))
</script>

{#if field.options.ui?.field?.hint === undefined || field.options.ui?.field?.hint === 'show'}
	<div data-ff-field-hint class={classes.root}>{@html field.options.ui?.hint}</div>
{:else if field.options.ui?.field?.hint === 'remove'}
	<!-- Nothing -->
{:else if field.options.ui?.field?.hint === 'hide'}
	<div class={classes.root}></div>
{/if}
