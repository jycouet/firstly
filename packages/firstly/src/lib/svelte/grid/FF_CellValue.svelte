<script lang="ts" generics="E">
	// Published cell-value renderer: the ONE place that turns a resolved Cell + row into output.
	// Render order: cellSnippet → component (props + rowToProps) → field_link <a> → displayCell.
	// Reused by the boutique FF_Grid and any app's own App_Grid, so the component+props escape is free.
	// resolveCellComponent returns the Component synchronously for eager `() => Comp` thunks (so
	// {#await} renders straight through, no flash) and a Promise for lazy `() => import(...)` thunks.
	import { displayCell } from './buildCells.js'
	import { resolveCellComponent } from './cellComponent.js'
	import type { Cell } from './cellTypes.js'

	let { cell, row }: { cell: Cell<E>; row: E } = $props()

	const resolvedComp = $derived(cell.component ? resolveCellComponent(cell.component) : undefined)
	const compProps = $derived({ ...(cell.props ?? {}), ...(cell.rowToProps?.(row) ?? {}) })
	const href = $derived(cell.kind === 'field_link' ? cell.field?.options.href : undefined)
</script>

{#if cell.cellSnippet}{@render cell.cellSnippet({ row, cell })}{:else if cell.component}{#await resolvedComp then C}{#if C}{@const Cc = C}<Cc {...compProps} />{/if}{/await}{:else if href}<a
		data-ff-link
		href={href(row)}>{displayCell(cell, row)}</a
	>{:else}{displayCell(cell, row)}{/if}
