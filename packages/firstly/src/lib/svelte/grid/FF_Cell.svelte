<script lang="ts">
	import type { Snippet } from 'svelte'

	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellProps } from './cellTypes.js'
	import FF_Cell_Content from './FF_Cell_Content.svelte'
	import FF_Cell_Error from './FF_Cell_Error.svelte'
	import FF_Cell_Hint from './FF_Cell_Hint.svelte'
	import FF_Cell_Label from './FF_Cell_Label.svelte'

	type Props = { debug?: boolean; children?: Snippet; value?: unknown } & CellProps

	let { children, value = $bindable(), ...props }: Props = $props()

	const default_uid = $props.id()
	let id = $derived(props.key ?? default_uid)
	let ui = $derived(props.ui)
	let mode = $derived(props.mode ?? 'edit')
	let debug = $derived(props.debug === true ? true : undefined)

	const contentConfig = { ...getCellElementConfig('content'), ...props.content?.config }
	const labelBase = getCellElementConfig('label')

	let hasError = $derived(!!props.error?.html)
	let labelProps = $derived(
		props.label
			? {
					...props.label,
					config: {
						...labelBase,
						...props.label.config,
						...(!hasError ? { width: 100 } : {}),
					},
				}
			: undefined,
	)
</script>

<div
	data-ff-cell
	style:--width={ui?.width ?? 100}
	style:--margin-left={ui?.marginLeft ?? 0}
	style:--margin-right={ui?.marginRight ?? 0}
	style:--width-mobile={ui?.mobile?.width ?? 100}
	style:--margin-left-mobile={ui?.mobile?.marginLeft ?? 0}
	style:--margin-right-mobile={ui?.mobile?.marginRight ?? 0}
	data-ff-cell-debug={debug}
>
	<FF_Cell_Label {id} elementProps={labelProps} />
	<FF_Cell_Error {id} elementProps={props.error} />
	{#if children}
		<div data-ff-cells style={getStyle(contentConfig)}>{@render children?.()}</div>
	{:else}
		<FF_Cell_Content {id} {mode} contentProps={props.content} bind:value />
	{/if}
	<FF_Cell_Hint {id} elementProps={props.hint} />
</div>

<style>
	[data-ff-cells] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}
	[data-ff-cell] {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
		box-sizing: border-box;
		padding: var(--ff-spacing, 0.5rem);
		flex: 1 1 calc(var(--width, 100) * 1%);
		max-width: calc(var(--width, 100) * 1%);
		min-width: 0;
		margin-left: calc(var(--margin-left, 0) * 1%);
		margin-right: calc(var(--margin-right, 0) * 1%);
	}
	:global([data-ff-cell] > *) {
		flex: 0 0 100%;
		width: 100%;
	}
	[data-ff-cell][data-ff-cell-debug] {
		outline: 1px solid var(--destructive, red);
		outline-offset: -1px;
	}
	@media screen and (max-width: 40rem) {
		[data-ff-cell] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--margin-left-mobile, 0) * 1%);
			margin-right: calc(var(--margin-right-mobile, 0) * 1%);
			padding: 0.15rem;
		}
	}
</style>
