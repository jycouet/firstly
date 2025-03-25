<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import {
		deepMerge,
		FF_Cell,
		FF_Edit,
		FF_Error,
		FF_Hint,
		FF_Label,
		FF_Repo,
		getClasses,
		type FieldTheme,
	} from './'
	import type { CellMetadata, CustomFieldDefaultProps } from './customField'
	import FF_Cell_Caption from './FF_Cell_Caption.svelte'
	import FF_Cell_Edit from './FF_Cell_Edit.svelte'
	import FF_Cell_Error from './FF_Cell_Error.svelte'
	import FF_Cell_Hint from './FF_Cell_Hint.svelte'

	const default_uid = $props.id()

	interface Props<valueType = unknown, entityType = unknown> {
		cell: CellMetadata<valueType, entityType>
		r?: FF_Repo<entityType>
		class?: string
	}

	let props: Props<valueType, entityType> = $props()

	// let classes = $derived(getClasses('field', props.classes))

	let key = $derived(props.cell.key ?? props.cell.field?.key ?? default_uid)
	let caption = $derived(props.cell.caption ?? props.cell.field?.caption)
	let hint = $derived(props.cell.field?.options.ui?.hint ?? props.cell.ui?.hint)
	// @ts-expect-error
	let ui = $derived(deepMerge(props.cell.field?.options.ui ?? {}, props.cell.ui ?? {}))

	let error = ''
	let value: any = $state('')
</script>

<div
	data-ff-cell
	data-ff-cells={props.cell.cells}
	style:--width={ui?.width ?? 100}
	style:--width-left={ui?.widthLeft ?? 0}
	style:--width-right={ui?.widthRight ?? 0}
	style:--width-mobile={ui?.mobile?.width ?? 100}
	style:--width-left-mobile={ui?.mobile?.widthLeft ?? 0}
	style:--width-right-mobile={ui?.mobile?.widthRight ?? 0}
	class={[key, props.class]}
>
	<FF_Cell_Caption {ui} {caption} {key} />
	<FF_Cell_Error {ui} {error} {key} />
	{#if props.cell.field}
		<FF_Cell_Edit field={props.cell.field} {error} bind:value />
	{/if}
	<FF_Cell_Hint {ui} {hint} {key} />

	<div data-ff-cells>
		{#each props.cell.cells ?? [] as children}
			<FF_Cell cell={children} />
		{/each}
	</div>

	{#if props.cell.type === 'form'}
		actions...
	{/if}
</div>

<style>
	[data-ff-cells] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}

	[data-ff-cell] {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: var(--ff-spacing);
		flex: 1 1 calc(var(--width, 100) * 1%);
		max-width: calc(var(--width, 100) * 1%);
		margin-left: calc(var(--width-left, 0) * 1%);
		margin-right: calc(var(--width-right, 0) * 1%);

		/* For debugging purposes - outline that doesn't affect layout */
		outline: 1px solid rgba(255, 0, 0, 0.5);
		outline-offset: -1px;
	}

	@media screen and (max-width: 40rem) {
		[data-ff-cell] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--width-left-mobile, 0) * 1%);
			margin-right: calc(var(--width-right-mobile, 0) * 1%);
		}
	}
</style>
