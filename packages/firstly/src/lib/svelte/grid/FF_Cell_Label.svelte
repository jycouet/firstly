<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = $derived({ ...getCellElementConfig('label'), ...elementProps?.config })
</script>

{#if elementProps}
	<label id={id + '-label'} data-ff-cell-label for={id} class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored caption -->
		{@html elementProps?.html}
	</label>
{/if}

<style>
	[data-ff-cell-label] {
		display: block;
		max-width: 100%;
		min-width: 0;
		overflow-wrap: anywhere;
	}
</style>
