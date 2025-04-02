<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CellMetadata } from './customField'

	interface Props<valueType = unknown, entityType = unknown> {
		key: string
		ui: CellMetadata<valueType, entityType>['ui']
		caption?: string
		class?: string
	}

	let { ui, key, class: localClass, caption }: Props<valueType, entityType> = $props()
</script>

{#if ui?.component?.caption === undefined || ui?.component?.caption === 'show'}
	<label data-ff-cell-caption for={key} class={localClass}>{@html caption}</label>
{:else if ui?.component?.caption === 'remove'}
	<!-- Nothing -->
{:else if ui?.component?.caption === 'hide'}
	<span data-ff-cell-caption class={localClass}></span>
{/if}
