<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CellMetadata } from './customField'

	interface Props<valueType = unknown, entityType = unknown> {
		key: string
		ui: CellMetadata<valueType, entityType>['ui']
		error?: string
		class?: string
	}

	let { ui, key, class: localClass, error }: Props<valueType, entityType> = $props()
</script>

{#if ui?.field?.error === undefined || ui?.field?.error === 'show'}
	<label data-ff-cell-error for={key} class={localClass}>{@html error}</label>
{:else if ui?.field?.error === 'remove'}
	<!-- Nothing -->
{:else if ui?.field?.error === 'hide'}
	<span data-ff-cell-error class={localClass}></span>
{/if}
