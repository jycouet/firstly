<script lang="ts">
	/**
	 * Schema drift UI: one section per flag enabled in `sqlAdmin({ drift })`.
	 *
	 * Styled against the host app's semantic theme tokens, like `<SqlAdmin />`.
	 * Results are logged to the console as `for AI:` after each run.
	 */
	import { onMount } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'

	import { errorMessage } from '../../core/helper.js'
	import { SqlDriftController, type SqlDriftFlag } from '../SqlDriftController'

	// Inferred from the BackendMethods, so this never imports from `server/`.
	type PkResult = Awaited<ReturnType<typeof SqlDriftController.primaryKeys>>
	type RelResult = Awaited<ReturnType<typeof SqlDriftController.relationIndexes>>
	type DropResult = Awaited<ReturnType<typeof SqlDriftController.orphanColumns>>
	type NullResult = Awaited<ReturnType<typeof SqlDriftController.nullable>>

	let flags = $state<Record<SqlDriftFlag, boolean> | null>(null)
	let flagsError = $state('')
	onMount(async () => {
		try {
			flags = await SqlDriftController.driftFlags()
		} catch (e) {
			flagsError = errorMessage(e)
		}
	})

	// --- Flow 1: primary key drift (dry run & upsert) ---
	let pkLoading = $state(false)
	let pkError = $state('')
	let pkResult = $state<PkResult | null>(null)

	const PK_ORDER = { migrate: 0, create: 0, missing: 1, ok: 2 } as const
	const pkPlans = $derived(
		(pkResult?.plans ?? []).toSorted(
			(a, b) => PK_ORDER[a.action] - PK_ORDER[b.action] || a.table.localeCompare(b.table),
		),
	)
	const pkDrift = $derived(
		pkPlans.filter((p) => p.action === 'migrate' || p.action === 'create').length,
	)

	async function runPk(apply: boolean) {
		if (
			apply &&
			!window.confirm(`Apply ${pkDrift} migration(s)? This briefly locks the affected tables.`)
		)
			return
		pkLoading = true
		pkError = ''
		try {
			pkResult = await SqlDriftController.primaryKeys({ apply })
			console.info('for AI:', JSON.stringify(pkResult))
		} catch (e) {
			pkError = errorMessage(e)
		} finally {
			pkLoading = false
		}
	}

	// --- Flow 2: relation indexes (dry run & create) ---
	let relLoading = $state(false)
	let relError = $state('')
	let relResult = $state<RelResult | null>(null)

	const REL_ORDER = { create: 0, missing: 1, ok: 2 } as const
	const relPlans = $derived(
		(relResult?.plans ?? []).toSorted(
			(a, b) => REL_ORDER[a.action] - REL_ORDER[b.action] || a.name.localeCompare(b.name),
		),
	)
	const relMissing = $derived(relPlans.filter((p) => p.action === 'create').length)

	async function runRel(apply: boolean) {
		if (apply && !window.confirm(`Create ${relMissing} relation index(es)?`)) return
		relLoading = true
		relError = ''
		try {
			relResult = await SqlDriftController.relationIndexes({ apply })
			console.info('for AI:', JSON.stringify(relResult))
		} catch (e) {
			relError = errorMessage(e)
		} finally {
			relLoading = false
		}
	}

	// --- Flow 3: drop orphan columns (dry run & selective drop) ---
	// Destructive, so unlike flows 1 & 2 the dry run lists every orphan, nothing is
	// selected by default, and apply drops only the ticked subset.
	let dropLoading = $state(false)
	let dropError = $state('')
	let dropResult = $state<DropResult | null>(null)
	const selected = new SvelteSet<string>()

	const keyOf = (p: { table: string; column: string }) => `${p.table}.${p.column}`

	const dropPlans = $derived(
		(dropResult?.plans ?? []).toSorted(
			(a, b) => a.table.localeCompare(b.table) || a.column.localeCompare(b.column),
		),
	)

	function toggle(key: string) {
		if (selected.has(key)) selected.delete(key)
		else selected.add(key)
	}

	async function runDrop(apply: boolean) {
		const cols = dropPlans.filter((p) => selected.has(keyOf(p)))
		if (apply) {
			if (cols.length === 0) return
			if (
				!window.confirm(
					`Drop ${cols.length} column${cols.length === 1 ? '' : 's'}? This briefly locks the affected tables and cannot be undone.\n\n${cols.map(keyOf).join('\n')}`,
				)
			)
				return
		}
		dropLoading = true
		dropError = ''
		try {
			dropResult = await SqlDriftController.orphanColumns(
				apply ? { apply: true, columns: cols } : { apply: false },
			)
			selected.clear()
			console.info('for AI:', JSON.stringify(dropResult))
		} catch (e) {
			dropError = errorMessage(e)
		} finally {
			dropLoading = false
		}
	}
	// --- Flow 4: nullability drift (dry run & selective fix) ---
	// Same shape as flow 3 and for the same reason: rewriting '' to NULL cannot be
	// undone, so nothing is ticked by default.
	let nullLoading = $state(false)
	let nullError = $state('')
	let nullResult = $state<NullResult | null>(null)
	const nullSelected = new SvelteSet<string>()

	const nullPlans = $derived(
		(nullResult?.plans ?? []).toSorted(
			(a, b) => a.table.localeCompare(b.table) || a.column.localeCompare(b.column),
		),
	)

	function toggleNull(key: string) {
		if (nullSelected.has(key)) nullSelected.delete(key)
		else nullSelected.add(key)
	}

	async function runNull(apply: boolean) {
		const cols = nullPlans.filter((p) => nullSelected.has(keyOf(p)))
		if (apply) {
			if (cols.length === 0) return
			const blanking = cols.filter((p) => p.blankToNull)
			if (
				!window.confirm(
					`Relax ${cols.length} column${cols.length === 1 ? '' : 's'}?` +
						(blanking.length
							? `\n\n${blanking.length} of them will also rewrite every '' row to NULL, which cannot be undone:\n${blanking.map(keyOf).join('\n')}`
							: ''),
				)
			)
				return
		}
		nullLoading = true
		nullError = ''
		try {
			nullResult = await SqlDriftController.nullable(
				apply ? { apply: true, columns: cols } : { apply: false },
			)
			nullSelected.clear()
			console.info('for AI:', JSON.stringify(nullResult))
		} catch (e) {
			nullError = errorMessage(e)
		} finally {
			nullLoading = false
		}
	}
</script>

{#snippet runButton(label: string, loading: boolean, onclick: () => void)}
	<button
		type="button"
		{onclick}
		disabled={loading}
		class="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
	>
		{loading ? 'Running…' : label}
	</button>
{/snippet}

{#snippet applyButton(label: string, disabled: boolean, onclick: () => void)}
	<button
		type="button"
		{onclick}
		{disabled}
		class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
	>
		{label}
	</button>
{/snippet}

{#snippet resultTable(headers: string[], children: import('svelte').Snippet)}
	<div class="border-border overflow-auto border">
		<table class="w-full border-collapse text-sm">
			<thead class="bg-muted">
				<tr>
					{#each headers as h (h)}
						<th class="border-border border-b px-3 py-2 text-left font-semibold">{h}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{@render children()}
			</tbody>
		</table>
	</div>
{/snippet}

<div class="border-border bg-card text-card-foreground border">
	<header class="px-5 py-4">
		<h2 class="text-lg font-semibold">Schema drift</h2>
		<p class="text-muted-foreground mt-1 text-sm">
			Remult creates tables and adds columns, but never revisits them. Each check below is a dry run
			first; applying runs in one transaction.
		</p>
		{#if flagsError}
			<pre
				class="border-destructive/40 bg-destructive/10 text-destructive mt-3 overflow-auto border p-3 text-sm">{flagsError}</pre>
		{:else if flags && !Object.values(flags).some(Boolean)}
			<p class="text-muted-foreground mt-3 text-sm">
				No check enabled. Opt in with <code class="font-mono"
					>sqlAdmin(&#123; drift: &#123; entities, relationIndexes: true, ... &#125; &#125;)</code
				>.
			</p>
		{/if}
	</header>

	<!-- Flow 1: primary keys -->
	{#if flags?.primaryKeys}
		<section class="border-border border-t p-5">
			<h3 class="text-sm font-semibold">Primary key drift</h3>
			<p class="text-muted-foreground mt-1 mb-4 max-w-[80ch] text-sm">
				Postgres only sets a PK on first table creation and never ALTERs it, so a later
				<code class="font-mono">id</code> change is silently ignored. Applying runs every migration atomically.
			</p>

			<div class="mb-4 flex flex-wrap gap-2">
				{@render runButton('Audit (dry run)', pkLoading, () => runPk(false))}
				{@render applyButton(
					`Apply ${pkDrift} migration${pkDrift === 1 ? '' : 's'}`,
					pkLoading || pkDrift === 0,
					() => runPk(true),
				)}
			</div>

			{#if pkError}
				<pre
					class="border-destructive/40 bg-destructive/10 text-destructive mb-4 overflow-auto border p-3 text-sm">{pkError}</pre>
			{/if}

			{#if pkResult}
				{#if pkResult.applied}
					<p class="border-primary/30 bg-primary/10 text-primary mb-3 border p-2 text-sm">
						Applied · {pkDrift} table{pkDrift === 1 ? '' : 's'} migrated
					</p>
				{/if}

				{#snippet pkRows()}
					{#each pkPlans as p (p.table)}
						<tr class="even:bg-muted/40" class:opacity-50={p.action === 'ok'}>
							<td class="border-border border-b px-3 py-2 font-mono">{p.table}</td>
							<td class="border-border text-muted-foreground border-b px-3 py-2 font-mono">
								{p.before.join(', ') || '-'}
							</td>
							<td class="border-border text-muted-foreground border-b px-3 py-2 font-mono">
								{p.after.join(', ')}
							</td>
							<td
								class="border-border border-b px-3 py-2 font-mono"
								class:text-primary={p.action === 'migrate' || p.action === 'create'}
								class:text-muted-foreground={p.action === 'missing'}
							>
								{p.action === 'missing' ? 'table missing · run migrations first' : p.action}
							</td>
						</tr>
					{/each}
				{/snippet}
				{@render resultTable(['Table', 'Current PK', 'Desired PK', 'Action'], pkRows)}
			{/if}
		</section>
	{/if}

	<!-- Flow 2: relation indexes -->
	{#if flags?.relationIndexes}
		<section class="border-border border-t p-5">
			<h3 class="text-sm font-semibold">Relation indexes</h3>
			<p class="text-muted-foreground mt-1 mb-4 max-w-[80ch] text-sm">
				Postgres doesn't auto-index foreign keys. This indexes the FK columns of
				<code class="font-mono">toOne</code> relations - unless they're already a leftmost prefix of an
				existing index (the PK counts), so <code class="font-mono">a</code> on a
				<code class="font-mono">(a, b)</code> table is skipped. Creates are idempotent (<code
					class="font-mono">FF_IX_</code
				>).
			</p>

			<div class="mb-4 flex flex-wrap gap-2">
				{@render runButton('Check (dry run)', relLoading, () => runRel(false))}
				{@render applyButton(
					`Create ${relMissing} index${relMissing === 1 ? '' : 'es'}`,
					relLoading || relMissing === 0,
					() => runRel(true),
				)}
			</div>

			{#if relError}
				<pre
					class="border-destructive/40 bg-destructive/10 text-destructive mb-4 overflow-auto border p-3 text-sm">{relError}</pre>
			{/if}

			{#if relResult}
				{#if relResult.applied}
					<p class="border-primary/30 bg-primary/10 text-primary mb-3 border p-2 text-sm">
						Created · {relMissing} index{relMissing === 1 ? '' : 'es'}
					</p>
				{/if}

				{#snippet relRows()}
					{#each relPlans as p (p.name)}
						<tr class="even:bg-muted/40" class:opacity-50={p.action === 'ok'}>
							<td class="border-border border-b px-3 py-2 font-mono">{p.name}</td>
							<td class="border-border text-muted-foreground border-b px-3 py-2 font-mono">
								{p.table} ({p.columns.join(', ')})
							</td>
							<td
								class="border-border border-b px-3 py-2 font-mono"
								class:text-primary={p.action === 'create'}
							>
								{p.action === 'ok'
									? `covered · ${p.coveredBy}`
									: p.action === 'missing'
										? 'table missing · run migrations first'
										: 'create'}
							</td>
						</tr>
					{/each}
				{/snippet}
				{@render resultTable(['Index', 'Columns', 'Status'], relRows)}
			{/if}
		</section>
	{/if}

	<!-- Flow 3: drop orphan columns -->
	{#if flags?.orphanColumns}
		<section class="border-border border-t p-5">
			<h3 class="text-sm font-semibold">Orphan columns</h3>
			<p class="text-muted-foreground mt-1 mb-4 max-w-[80ch] text-sm">
				Remult only ever ADDs columns, never drops them, so a field removed from an entity leaves its
				column behind. This lists live columns no entity field declares - e.g. a
				<code class="font-mono">createdAt</code> now covered by the changelog. Destructive, so nothing
				is selected by default: tick the columns to <code class="font-mono">DROP</code>.
			</p>

			<div class="mb-4 flex flex-wrap gap-2">
				{@render runButton('Check (dry run)', dropLoading, () => runDrop(false))}
				{@render applyButton(
					`Drop ${selected.size} column${selected.size === 1 ? '' : 's'}`,
					dropLoading || selected.size === 0,
					() => runDrop(true),
				)}
			</div>

			{#if dropError}
				<pre
					class="border-destructive/40 bg-destructive/10 text-destructive mb-4 overflow-auto border p-3 text-sm">{dropError}</pre>
			{/if}

			{#if dropResult}
				{#if dropResult.applied}
					<p class="border-primary/30 bg-primary/10 text-primary mb-3 border p-2 text-sm">
						Dropped · {dropResult.dropped.length} column{dropResult.dropped.length === 1 ? '' : 's'}
					</p>
				{/if}

				{#if dropPlans.length === 0}
					<p class="text-muted-foreground text-sm">No orphan columns - every column maps to a field.</p>
				{:else}
					{#snippet dropRows()}
						{#each dropPlans as p (keyOf(p))}
							<tr class="even:bg-muted/40">
								<td class="border-border border-b px-3 py-2">
									<input
										type="checkbox"
										checked={selected.has(keyOf(p))}
										onchange={() => toggle(keyOf(p))}
										aria-label={`Drop ${keyOf(p)}`}
									/>
								</td>
								<td class="border-border border-b px-3 py-2 font-mono">{p.table}</td>
								<td class="border-border text-primary border-b px-3 py-2 font-mono">{p.column}</td>
							</tr>
						{/each}
					{/snippet}
					{@render resultTable(['', 'Table', 'Column'], dropRows)}
				{/if}
			{/if}
		</section>
	{/if}

	<!-- Flow 4: nullability drift -->
	{#if flags?.nullable}
		<section class="border-border border-t p-5">
			<h3 class="text-sm font-semibold">Nullability drift</h3>
			<p class="text-muted-foreground mt-1 mb-4 max-w-[80ch] text-sm">
				A field that is not <code class="font-mono">allowNull</code> makes Remult create the column
				<code class="font-mono">default '' not null</code>, and it never relaxes that afterwards. So a
				column added before its field learned <code class="font-mono">allowNull</code> still hands every
				pre-existing row an empty string the entity now types as <code class="font-mono">null</code>.
				This lists those columns: applying drops the default and the NOT NULL, and - for text columns
				only - rewrites <code class="font-mono">''</code> to <code class="font-mono">NULL</code>. A
				numeric or boolean empty value (<code class="font-mono">0</code>,
				<code class="font-mono">false</code>) may be real data, so those keep their rows and only lose
				the constraint. Destructive, so nothing is selected by default.
			</p>

			<div class="mb-4 flex flex-wrap gap-2">
				{@render runButton('Check (dry run)', nullLoading, () => runNull(false))}
				{@render applyButton(
					`Fix ${nullSelected.size} column${nullSelected.size === 1 ? '' : 's'}`,
					nullLoading || nullSelected.size === 0,
					() => runNull(true),
				)}
			</div>

			{#if nullError}
				<pre
					class="border-destructive/40 bg-destructive/10 text-destructive mb-4 overflow-auto border p-3 text-sm">{nullError}</pre>
			{/if}

			{#if nullResult}
				{#if nullResult.applied}
					<p class="border-primary/30 bg-primary/10 text-primary mb-3 border p-2 text-sm">
						Fixed · {nullResult.fixed.length} column{nullResult.fixed.length === 1 ? '' : 's'}
					</p>
				{/if}

				{#if nullPlans.length === 0}
					<p class="text-muted-foreground text-sm">
						No drift - every nullable field has a plain nullable column.
					</p>
				{:else}
					{#snippet nullRows()}
						{#each nullPlans as p (keyOf(p))}
							<tr class="even:bg-muted/40">
								<td class="border-border border-b px-3 py-2">
									<input
										type="checkbox"
										checked={nullSelected.has(keyOf(p))}
										onchange={() => toggleNull(keyOf(p))}
										aria-label={`Fix ${keyOf(p)}`}
									/>
								</td>
								<td class="border-border border-b px-3 py-2 font-mono">{p.table}</td>
								<td class="border-border text-primary border-b px-3 py-2 font-mono">{p.column}</td>
								<td class="border-border border-b px-3 py-2 text-sm">
									{[p.dropDefault && 'drop default', p.dropNotNull && 'drop not null']
										.filter(Boolean)
										.join(' · ')}
								</td>
								<td class="border-border border-b px-3 py-2 text-sm">
									{p.blankToNull ? "'' → NULL" : 'rows kept'}
								</td>
							</tr>
						{/each}
					{/snippet}
					{@render resultTable(['', 'Table', 'Column', 'Constraint', 'Rows'], nullRows)}
				{/if}
			{/if}
		</section>
	{/if}
</div>
