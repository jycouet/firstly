<script lang="ts" generics="T extends { id: string }">
	import type { ClassType, EntityFilter } from 'remult'

	import { ffConfig } from '../FF_Config.svelte.js'
	import { ff } from '../ff.svelte.js'
	import { buildCells } from './buildCells.js'
	import type { CellInput } from './cellTypes.js'
	import FF_Cell from './FF_Cell.svelte'

	type Props = {
		entity: ClassType<T>
		/** Field descriptors (terse key or config). Defaults to visible fields. */
		selected?: CellInput<T>[]
		where?: EntityFilter<T>
		onsaved?: (saved: T) => void
	}
	let { entity, selected, where, onsaved }: Props = $props()

	const r = ff(entity).one(() => ({ where }))
	const cells = $derived(buildCells(r.meta, selected))

	// Read app-level config ONCE at init (getContext must run during init). `cfg.cell` stays reactive.
	const cfg = ffConfig()

	// keep `r.item as Record` casts in <script> so prettier can't strip generics in markup
	const get = (key: string): unknown => (r.item as Record<string, unknown> | undefined)?.[key]
	const set = (key: string, v: unknown) => {
		if (r.item) (r.item as Record<string, unknown>)[key] = v
	}

	let errors = $state<Record<string, string | undefined>>({})
	let formError = $state('')

	async function submit(e: SubmitEvent) {
		e.preventDefault()
		try {
			const saved = await r.save()
			errors = {}
			formError = ''
			onsaved?.(saved)
		} catch (err) {
			const ms = (err as { modelState?: Record<string, string> })?.modelState
			errors = ms ?? {}
			formError = err instanceof Error ? err.message : String(err)
		}
	}
</script>

{#if r.loading.init}
	<p data-ff-form-loading>…</p>
{:else if r.item}
	<form data-ff-form onsubmit={submit}>
		<FF_Cell>
			{#each cells as cell (cell.col ?? cell.kind)}
				{#if cell.col}
					{@const col = cell.col}
					<FF_Cell
						key={col}
						ui={cell.ui}
						label={{ html: cell.caption }}
						error={{ html: errors[col] }}
						content={{
							component: cfg.cell.inputs?.[cell.inputType],
							props: {
								type: cell.inputType,
								placeholder: cell.field?.options.placeholder,
								valueConverter: cell.field?.valueConverter,
							},
						}}
						bind:value={() => get(col), (v) => set(col, v)}
					></FF_Cell>
				{:else}
					<FF_Cell ui={cell.ui}></FF_Cell>
				{/if}
			{/each}
		</FF_Cell>
		{#if formError}<p data-ff-form-error>{formError}</p>{/if}
		<button type="submit" data-ff-form-save disabled={r.isWriting || !r.meta.apiUpdateAllowed(r.item)}>
			Save
		</button>
	</form>
{:else}
	<button data-ff-form-new disabled={!r.meta.apiInsertAllowed()} onclick={() => r.create()}>+ New</button>
{/if}
