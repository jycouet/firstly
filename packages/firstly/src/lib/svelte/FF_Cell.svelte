<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import { deepMerge, FF_Cell, FF_Repo } from './'
	import type { CellMetadata } from './customField'
	import FF_Cell_Caption from './FF_Cell_Caption.svelte'
	import FF_Cell_Display from './FF_Cell_Display.svelte'
	import FF_Cell_Edit from './FF_Cell_Edit.svelte'
	import FF_Cell_Error from './FF_Cell_Error.svelte'
	import FF_Cell_Hint from './FF_Cell_Hint.svelte'

	const default_uid = $props.id()

	interface Props<valueType = unknown, entityType = unknown> {
		cell: CellMetadata<valueType, entityType>
		r?: FF_Repo<entityType>
		class?: string
		value?: valueType
		error?: string
	}

	// eslint-disable-next-line svelte/no-unused-props
	let { value = $bindable(), error, ...props }: Props<valueType, entityType> = $props()

	// let classes = $derived(getClasses('field', props.classes))

	let key = $derived(props.cell.key ?? props.cell.field?.key ?? default_uid)
	let caption = $derived(props.cell.caption ?? props.cell.field?.caption)
	let hint = $derived(props.cell.field?.options.ui?.hint ?? props.cell.ui?.hint)
	// @ts-ignore
	let ui = $derived(deepMerge(props.cell.field?.options.ui ?? {}, props.cell.ui ?? {}))
</script>

<!-- Snippets sections -->
{#snippet cellsChildren(isForm: boolean = false)}
	<div data-ff-cells>
		{#each props.cell.cells ?? [] as children}
			<FF_Cell cell={children} />
		{/each}
	</div>
{/snippet}

<!-- Main section -->
<div
	data-ff-cell
	data-ff-cells={props.cell.cells}
	style:--width={ui?.width ?? 100}
	style:--margin-left={ui?.marginLeft ?? 0}
	style:--margin-right={ui?.marginRight ?? 0}
	style:--width-mobile={ui?.mobile?.width ?? 100}
	style:--margin-left-mobile={ui?.mobile?.marginLeft ?? 0}
	style:--margin-right-mobile={ui?.mobile?.marginRight ?? 0}
	class={[key, props.class]}
>
	<FF_Cell_Caption {ui} {caption} {key} />
	<FF_Cell_Error {ui} {error} {key} />
	{#if props.cell.field}
		{#if props.cell.mode === 'edit'}
			<FF_Cell_Edit field={props.cell.field} {error} bind:value />
		{:else}
			<FF_Cell_Display field={props.cell.field} {error} {value} />
		{/if}
	{/if}
	<FF_Cell_Hint {ui} {hint} {key} />

	{#if props.cell.type === 'form'}
		<form>
			{@render cellsChildren(true)}
			<button type="submit">Submit</button>
		</form>
	{:else}
		{@render cellsChildren()}
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
		margin-left: calc(var(--margin-left, 0) * 1%);
		margin-right: calc(var(--margin-right, 0) * 1%);

		/* For debugging purposes - outline that doesn't affect layout */
		outline: 1px solid rgba(255, 0, 0, 0.5);
		outline-offset: -1px;
	}

	@media screen and (max-width: 40rem) {
		[data-ff-cell] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--margin-left-mobile, 0) * 1%);
			margin-right: calc(var(--margin-right-mobile, 0) * 1%);
		}
	}
</style>
