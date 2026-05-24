<script lang="ts" generics="T extends { id: string }">
	import type { ClassType, EntityFilter } from 'remult'

	import { ff } from './ff.svelte.js'

	type Props = {
		/** The remult entity class. */
		entity: ClassType<T>
		/** Fields to edit. Labels come from each field's `caption`. */
		fields: (keyof T & string)[]
		/** Which record (remult `EntityFilter`). Default: findFirst by `defaultOrderBy` (the latest). */
		where?: EntityFilter<T>
	}
	let { entity, fields, where }: Props = $props()

	// A single bound record: `where` (or findFirst by the entity's defaultOrderBy - the latest row).
	const r = ff(entity).one(() => ({ where }))

	const get = (row: T, f: keyof T & string) => (row as Record<string, unknown>)[f]
	function setField(f: keyof T & string, value: string) {
		if (r.item) (r.item as Record<string, unknown>)[f] = value
	}
</script>

<div class="form">
	{#if r.loading.init}
		<p class="muted">Loading…</p>
	{:else if r.item}
		{#each fields as f (f)}
			<label>
				<span>{r.meta.fields.find(f)?.caption ?? f}</span>
				<input
					value={String(get(r.item, f) ?? '')}
					oninput={(e) => setField(f, e.currentTarget.value)}
				/>
			</label>
		{/each}
		<div class="actions">
			<button
				disabled={r.isWriting ||
					(r.item.id ? !r.meta.apiUpdateAllowed(r.item) : !r.meta.apiInsertAllowed(r.item))}
				onclick={() => r.save()}
			>
				Save
			</button>
			{#if r.isWriting}<span class="busy">saving…</span>{/if}
		</div>
		{#if r.error}<p class="err">{r.error}</p>{/if}
	{:else}
		<p class="muted">No record yet.</p>
		<button disabled={!r.meta.apiInsertAllowed()} onclick={() => r.create()}>+ New</button>
	{/if}
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: stretch;
		font-size: 14px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	label span {
		font-size: 12px;
		opacity: 0.65;
	}
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 7px 10px;
		font: inherit;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 8px;
	}
	input:focus-visible {
		outline: none;
		border-color: color-mix(in srgb, currentColor 55%, transparent);
	}
	.actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.busy {
		color: #d97706;
		font-weight: 600;
		font-size: 12px;
	}
	.err {
		color: #dc2626;
		margin: 0;
		font-size: 13px;
	}
	button {
		cursor: pointer;
		font: inherit;
		padding: 6px 14px;
		color: inherit;
		background: color-mix(in srgb, currentColor 8%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
		border-radius: 8px;
		transition: background 0.14s ease;
	}
	button:hover {
		background: color-mix(in srgb, currentColor 15%, transparent);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.muted {
		opacity: 0.6;
	}
</style>
