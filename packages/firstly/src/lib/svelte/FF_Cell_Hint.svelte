<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CellMetadata } from './customField'

	interface Props<valueType = unknown, entityType = unknown> {
		key: string
		ui: CellMetadata<valueType, entityType>['ui']
		hint?: string
		class?: string
	}

	let { ui, key, class: localClass, hint }: Props<valueType, entityType> = $props()
</script>

{#if ui?.field?.hint === undefined || ui?.field?.hint === 'show'}
	<label data-ff-cell-hint for={key} class={localClass}>{@html hint}</label>
{:else if ui?.field?.hint === 'remove'}
	<!-- Nothing -->
{:else if ui?.field?.hint === 'hide'}
	<span data-ff-cell-hint class={localClass}></span>
{/if}
