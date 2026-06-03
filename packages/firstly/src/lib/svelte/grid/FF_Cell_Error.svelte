<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = $derived({ ...getCellElementConfig('error'), ...elementProps?.config })
</script>

{#if elementProps}
	<div id={id + '-error'} data-ff-cell-error class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored error html -->
		{@html elementProps?.html}
	</div>
{/if}

<style>
	[data-ff-cell-error] {
		color: var(--color-error, red);
		font-size: smaller;
	}
</style>
