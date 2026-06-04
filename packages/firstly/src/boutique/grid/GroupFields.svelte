<script lang="ts" generics="T extends object">
	// Boutique "group of fields" — a metadata-driven group of cells bound to a draft.
	//   • mode 'edit'      → cells are inputs (registered via FF_Config.cell.inputs)
	//   • mode 'readonly'  → cells show their values
	// Give it `onsave` (in edit mode) and the group BECOMES a form, with a Save + optional
	// Delete action row. Reused by FF_Group (bound record) and FF_Grid's edit dialog.
	import type { EntityMetadata } from 'remult'
	import {
		buildCells,
		displayCell,
		FF_Cell,
		ffConfig,
		Icon,
		LibIcon_Delete,
		LibIcon_Save,
		type CellInput,
	} from 'firstly/svelte'

	type Props = {
		/** Entity metadata (from the ff handle's `.meta`). */
		meta: EntityMetadata<T>
		/** The record being shown/edited — bound directly (mutated in place in edit mode). */
		draft: T
		selected?: CellInput<T>[]
		/** 'edit' (inputs) or 'readonly' (values). */
		mode?: 'edit' | 'readonly'
		errors?: Record<string, string | undefined>
		error?: string
		busy?: boolean
		saveLabel?: string
		canSave?: boolean
		/** When provided (in edit mode) the group becomes a form with a Save action. */
		onsave?: () => void | Promise<void>
		/** When provided, a Delete action is shown. Omit to hide it. */
		ondelete?: () => void | Promise<void>
		/** Show Delete but disabled (pure UI). */
		disableDelete?: boolean
	}
	let {
		meta,
		draft,
		selected,
		mode = 'edit',
		errors = {},
		error = '',
		busy = false,
		saveLabel = 'Save',
		canSave = true,
		onsave,
		ondelete,
		disableDelete = false,
	}: Props = $props()

	const cells = $derived(buildCells(meta, selected))
	const isForm = $derived(mode === 'edit' && !!onsave)

	// Read app-level config ONCE at init (getContext must run during init).
	const cfg = ffConfig()
	const inputFor = (inputType: string) => cfg.cell.inputs?.[inputType]

	// keep `draft as Record` casts in <script> so prettier can't strip generics in markup
	const get = (key: string): unknown => (draft as Record<string, unknown>)[key]
	const set = (key: string, v: unknown) => {
		;(draft as Record<string, unknown>)[key] = v
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault()
		await onsave?.()
	}
</script>

{#snippet body()}
	<FF_Cell>
		{#each cells as cell, i (cell.col ?? `${cell.kind}-${i}`)}
			{#if cell.col}
				{@const col = cell.col}
				{#if mode === 'readonly'}
					<FF_Cell key={col} ui={cell.ui} label={{ html: cell.caption }}>
						<span data-ff-readonly data-input-type={cell.inputType}>{displayCell(cell, draft)}</span>
					</FF_Cell>
				{:else}
					<FF_Cell
						key={col}
						ui={cell.ui}
						label={{ html: cell.caption }}
						error={{ html: errors[col] }}
						content={{
							component: inputFor(cell.inputType),
							props: {
								type: cell.inputType,
								placeholder: cell.field?.options.placeholder,
								valueConverter: cell.field?.valueConverter,
							},
						}}
						bind:value={() => get(col), (v) => set(col, v)}
					></FF_Cell>
				{/if}
			{:else}
				<FF_Cell ui={cell.ui}></FF_Cell>
			{/if}
		{/each}

		{#if onsave}
			<!-- Action row is rendered in both modes (kept empty in readonly) so switching mode
			     doesn't shift the layout. The buttons only show in edit mode. -->
			<FF_Cell content={{ config: { align: 'MiddleRight' } }}>
				<div data-ff-form-actions>
					{#if mode === 'edit'}
						{#if ondelete}
							<button
								type="button"
								data-danger
								title="Delete"
								disabled={busy || disableDelete}
								onclick={ondelete}
							>
								<Icon size="1.05rem" data={LibIcon_Delete} />
							</button>
						{/if}
						<button type="submit" data-primary disabled={busy || !canSave}>
							<Icon size="1.05rem" data={LibIcon_Save} />
							{saveLabel}
						</button>
					{/if}
				</div>
			</FF_Cell>
		{/if}
	</FF_Cell>
{/snippet}

{#if isForm}
	<form data-ff-form onsubmit={submit}>
		{@render body()}
		{#if error}<p data-ff-form-error>{error}</p>{/if}
	</form>
{:else}
	<div data-ff-group>
		{@render body()}
	</div>
{/if}
