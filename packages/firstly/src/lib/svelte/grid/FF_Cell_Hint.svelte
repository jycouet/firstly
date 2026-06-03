<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = $derived({ ...getCellElementConfig('hint'), ...elementProps?.config })
</script>

{#if elementProps}
	<div id={id + '-hint'} data-ff-cell-hint class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored hint html -->
		{@html elementProps?.html}
	</div>
{/if}

<style>
	[data-ff-cell-hint] {
		color: var(--muted-foreground, color-mix(in srgb, currentColor 60%, transparent));
		font-size: smaller;
	}
</style>
