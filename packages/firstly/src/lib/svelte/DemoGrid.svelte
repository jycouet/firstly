<script lang="ts" generics="T extends { id: string }">
	import type { ClassType, EntityFilter, MembersOnly } from 'remult'

	import { ffRepo } from './FF_Repo.svelte.js'

	type Props = {
		/** The remult entity class to CRUD. */
		entity: ClassType<T>
		/** Fields to show as columns / edit inputs. Headers come from each field's `caption`. */
		fields: (keyof T & string)[]
	}
	let { entity, fields }: Props = $props()

	// live list - any write re-emits it, so no reconcile code (entity is static config)
	const list = ffRepo(entity).listen(() => ({}))

	// the row being edited (by id), or a fresh draft for "new" - one reactive slot
	let editingId = $state<string | null>(null)
	const editor = ffRepo(entity).one(() => ({
		where: { id: editingId ?? '' } as EntityFilter<T>,
		enabled: !!editingId,
	}))
	const creating = $derived(!!editor.item && !editor.item.id)

	// dynamic read/write of a field by key (v1: inputs are text)
	const get = (row: T, f: keyof T & string) => (row as Record<string, unknown>)[f]
	function setField(f: keyof T & string, value: string) {
		if (editor.item) (editor.item as Record<string, unknown>)[f] = value
	}

	function edit(id: string) {
		editingId = id // → editor.item loads that row
	}
	function add() {
		editingId = null
		editor.create() // blank draft into editor.item
	}
	function cancel() {
		editingId = null
		editor.item = undefined // drop the draft / stop editing
	}
	async function save() {
		await editor.save() // insert (a draft) or update (the loaded row); the live list self-syncs
		cancel()
	}
	async function remove(row: T) {
		await list.repo.delete(row as Partial<MembersOnly<T>>) // raw delete via .repo; the live list drops the row
	}
</script>

{#snippet editRow(draft: T)}
	{#each fields as f (f)}
		<td>
			<input
				placeholder={list.meta.fields.find(f)?.caption ?? f}
				value={String(get(draft, f) ?? '')}
				oninput={(e) => setField(f, e.currentTarget.value)}
			/>
		</td>
	{/each}
	<td class="actions">
		<button disabled={editor.loading.saving} onclick={save}>Save</button>
		<button onclick={cancel}>Cancel</button>
	</td>
{/snippet}

<div class="crud">
	<button class="new" onclick={add}>+ New</button>

	<table>
		<thead>
			<tr>
				{#each fields as f (f)}<th>{list.meta.fields.find(f)?.caption ?? f}</th>{/each}
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#if creating && editor.item}
				<tr class="editing">{@render editRow(editor.item)}</tr>
			{/if}
			{#each list.items as row (row.id)}
				<tr class:editing={editingId === row.id}>
					{#if editingId === row.id && editor.item}
						{@render editRow(editor.item)}
					{:else}
						{#each fields as f (f)}<td>{get(row, f)}</td>{/each}
						<td class="actions">
							<button onclick={() => edit(row.id)}>Edit</button>
							<button onclick={() => remove(row)}>Delete</button>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>

	{#if list.loading.init}
		<p class="muted">Loading…</p>
	{:else if list.items.length === 0 && !creating}
		<p class="muted">Nothing yet - hit “+ New”.</p>
	{/if}
</div>

<style>
	.crud {
		font-size: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: start;
	}
	table {
		border-collapse: collapse;
		width: 100%;
	}
	th,
	td {
		border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
		padding: 7px 10px;
		text-align: left;
		vertical-align: middle;
	}
	th {
		font-weight: 600;
		background: color-mix(in srgb, currentColor 7%, transparent);
	}
	tr.editing {
		background: color-mix(in srgb, currentColor 5%, transparent);
	}
	td.actions {
		white-space: nowrap;
		text-align: right;
	}
	td.actions button + button {
		margin-left: 6px;
	}
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 5px 7px;
		font: inherit;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
		border-radius: 6px;
	}
	button {
		cursor: pointer;
		font: inherit;
		padding: 4px 11px;
		color: inherit;
		background: color-mix(in srgb, currentColor 6%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 6px;
		transition: background 0.12s ease;
	}
	button:hover {
		background: color-mix(in srgb, currentColor 14%, transparent);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.muted {
		opacity: 0.6;
	}
</style>
