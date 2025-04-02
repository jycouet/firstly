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

{#if ui?.component?.error === undefined || ui?.component?.error === 'show'}
	<label data-ff-cell-error for={key} class={localClass}>{@html error}</label>
{:else if ui?.component?.error === 'remove'}
	<!-- Nothing -->
{:else if ui?.component?.error === 'hide'}
	<span data-ff-cell-error class={localClass}></span>
{/if}
