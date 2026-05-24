<script lang="ts" generics="T extends { id: string }">
	import type { ClassType, EntityFilter } from 'remult'

	import { ff, type FF_Many, type ManyStrategy } from './ff.svelte.js'

	type Props = {
		/** The remult entity class to CRUD. */
		entity: ClassType<T>
		/** Fields to show as columns / edit inputs. Headers come from each field's `caption`. */
		fields: (keyof T & string)[]
		/** Filter the list (remult `EntityFilter`). Reactive: change it to re-fetch. */
		where?: EntityFilter<T>
		/** Fetch strategy: `paginate` (default), `listen` (live), or `load` (static one-shot). */
		strategy?: ManyStrategy
		/** When false the list query is skipped (no auto-load) until it flips true. */
		enabled?: boolean
		/** Rows per page (paginate strategy). */
		pageSize?: number
	}
	let {
		entity,
		fields,
		where,
		strategy = 'paginate',
		enabled = true,
		pageSize = 25,
	}: Props = $props()

	// ONE handle does it all: list (per strategy) + editing draft + writes.
	// Cast to the paginate view so `more()`/`aggregates`/`refresh` are reachable; guarded below.
	const m = ff(entity).many(() => ({ where, enabled, pageSize }), strategy) as unknown as FF_Many<
		T,
		'paginate'
	>

	const creating = $derived(!!m.draft && !m.draft.id)

	// dynamic read/write of a field by key (v1: inputs are text)
	const get = (row: T, f: keyof T & string) => (row as Record<string, unknown>)[f]
	function setField(f: keyof T & string, value: string) {
		if (m.draft) (m.draft as Record<string, unknown>)[f] = value
	}
</script>

{#snippet editRow(draft: T)}
	{#each fields as f (f)}
		<td>
			<input
				placeholder={m.meta.fields.find(f)?.caption ?? f}
				value={String(get(draft, f) ?? '')}
				oninput={(e) => setField(f, e.currentTarget.value)}
			/>
		</td>
	{/each}
	<td class="actions">
		<button
			disabled={m.isWriting ||
				(draft.id ? !m.meta.apiUpdateAllowed(draft) : !m.meta.apiInsertAllowed(draft))}
			onclick={() => m.save()}
		>
			Save
		</button>
		<button onclick={() => m.cancel()}>Cancel</button>
	</td>
{/snippet}

<div class="crud">
	<div class="bar">
		<button disabled={!m.meta.apiInsertAllowed()} onclick={() => m.create()}>+ New</button>
		{#if strategy !== 'listen'}
			<button onclick={() => m.refresh()}>Refresh</button>
		{/if}
		{#if strategy === 'paginate' && m.aggregates}<span class="count">{m.aggregates.$count} rows</span
			>{/if}
		{#if m.isBusy}<span class="busy">busy…</span>{/if}
	</div>

	{#if m.error}<p class="err">{m.error}</p>{/if}

	<table>
		<thead>
			<tr>
				{#each fields as f (f)}<th>{m.meta.fields.find(f)?.caption ?? f}</th>{/each}
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#if creating && m.draft}
				<tr class="editing">{@render editRow(m.draft)}</tr>
			{/if}
			{#if m.loading.init}
				<!--
					First-load placeholder. We know `fields`, so we render one shimmer cell per column
					plus a button-sized cell in the actions column - that keeps each skeleton row the
					same height as a real row, so the table doesn't jump when the data arrives.
				-->
				{#each Array(2) as _, i (i)}
					<tr>
						{#each fields as f (f)}<td><span class="sk"></span></td>{/each}
						<td class="actions"><span class="sk sk-btn"></span></td>
					</tr>
				{/each}
			{:else}
				{#each m.items as row (row.id)}
					<tr class:editing={m.draft?.id === row.id}>
						{#if m.draft && m.draft.id === row.id}
							{@render editRow(m.draft)}
						{:else}
							{#each fields as f (f)}<td>{get(row, f)}</td>{/each}
							<td class="actions">
								<button disabled={!m.meta.apiUpdateAllowed(row)} onclick={() => m.edit(row)}> Edit </button>
								<button disabled={!m.meta.apiDeleteAllowed(row)} onclick={() => m.remove(row)}>
									Delete
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	{#if strategy === 'paginate' && m.hasNextPage}
		<!--
			Manual "More". To auto-load on scroll instead, use the `infiniteScroll` attachment
			(also from 'firstly/svelte') on a bottom sentinel:
			<div {@attach infiniteScroll({
				hasMore: () => m.hasNextPage,
				loading: () => m.loading.more,
				onMore: () => m.more(),
			})}></div>
		-->
		<button disabled={m.loading.more} onclick={() => m.more()}>
			{m.loading.more ? 'Loading…' : 'More'}
		</button>
	{/if}

	{#if !enabled}
		<p class="muted">Not loaded (<code>enabled: false</code>) - flip it to fetch.</p>
	{:else if !m.loading.init && m.items.length === 0 && !creating}
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
	.bar {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
	}
	.count {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}
	.busy {
		font-size: 12px;
		color: #f59e0b;
		font-weight: 600;
	}
	.err {
		color: #ef4444;
		margin: 0;
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
	.sk {
		display: inline-block;
		width: 70%;
		height: 0.8em;
		border-radius: 4px;
		background: color-mix(in srgb, currentColor 16%, transparent);
		animation: sk-pulse 1.2s ease-in-out infinite;
	}
	/* button-sized so a skeleton row matches a real (button-bearing) row's height */
	.sk-btn {
		width: 3.4em;
		height: 1.9em;
	}
	@keyframes sk-pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 0.85;
		}
	}
	code {
		font-size: 12px;
	}
</style>
