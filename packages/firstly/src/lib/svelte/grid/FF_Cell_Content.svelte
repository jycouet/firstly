<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellContentProps, CellMode } from './cellTypes.js'

	interface Props {
		id: string
		contentProps?: CellContentProps
		value?: unknown
		mode: CellMode
	}
	let { id, contentProps, value = $bindable(), mode }: Props = $props()
	const base = getCellElementConfig('content')
	const contentConfig = $derived({ ...base, ...contentProps?.config })
	const Component = $derived(
		mode === 'edit'
			? contentProps?.component
			: (contentProps?.componentReadonly ?? contentProps?.component),
	)
</script>

{#if Component}
	<div id={id + '-content'} data-ff-cell-content class={contentConfig.class} style={getStyle(contentConfig)}>
		<Component {id} {...contentProps?.props} bind:value>
			{#if typeof contentProps?.children === 'string'}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored content -->
				{@html contentProps?.children}
			{:else}
				{contentProps?.children}
			{/if}
		</Component>
	</div>
{/if}
