<script lang="ts">
	/**
	 * SQL Admin UI.
	 *
	 * Dark theme (zinc + indigo accent), styled with raw Tailwind utilities only -
	 * no plugin (daisyUI, shadcn, etc.) required. Drop into any Tailwind-powered
	 * project and it just works.
	 *
	 * Results are logged to the browser console as `for AI: <json rows>` after
	 * each successful query - chrome-devtools / AI agents inspecting the page
	 * can read them with `list_console_messages`.
	 */
	import { log } from '../index'
	import { SqlAdminController } from '../SqlAdminController'

	const defaultQuery = `SELECT *
FROM "public"."users"
LIMIT 10`

	let sqlInput = $state(defaultQuery)
	let result: any = $state()
	let error = $state('')
	let isLoading = $state(false)

	const queries = {
		default: { label: 'Default', sql: defaultQuery },
		tables: {
			label: 'Tables & Sizes',
			sql: `SELECT
  table_schema,
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_size,
  pg_size_pretty(pg_table_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as data_size,
  pg_size_pretty(pg_indexes_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as index_size
FROM information_schema.tables
WHERE table_schema IN ('public', 'ff_auth')
ORDER BY pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)) DESC;`,
		},
		indexes: {
			label: 'Indexes',
			sql: `SELECT *
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname`,
		},
		dbSize: {
			label: 'Database Size',
			sql: `SELECT
  current_database() as database_name,
  pg_size_pretty(pg_database_size(current_database())) as database_size`,
		},
	} as const

	log.info('AI Hint: results are also logged as "for AI:" JSON after each query.')

	function setPresetQuery(queryId: keyof typeof queries) {
		sqlInput = queries[queryId].sql
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		try {
			error = ''
			isLoading = true
			result = { ...(await SqlAdminController.exec(sqlInput)) }
			log.info('for AI:', JSON.stringify(result.r.rows))
			log.info('for humans:', result)
		} catch (e) {
			error = JSON.stringify(e, null, 2)
		} finally {
			isLoading = false
		}
	}

	function getHeaders(rows: any[]): string[] {
		if (!rows || rows.length === 0) return []
		return Object.keys(rows[0])
	}
</script>

<div class="border border-slate-700 bg-slate-800 text-slate-200">
	<header class="border-b border-slate-700 px-5 py-4">
		<h2 class="text-lg font-semibold text-slate-100">SQL Admin</h2>
		<p class="mt-1 text-sm text-slate-400">
			Execute SQL queries directly on the database. Results are displayed below and also logged to the
			browser console.
		</p>
	</header>

	<div class="flex flex-col gap-4 p-5">
		<div class="flex flex-wrap gap-2">
			{#each Object.entries(queries) as [id, query] (id)}
				<button
					type="button"
					class="border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-50"
					onclick={() => setPresetQuery(id as keyof typeof queries)}>{query.label}</button
				>
			{/each}
		</div>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<textarea
				bind:value={sqlInput}
				class="h-52 w-full border border-slate-700 bg-slate-900 p-3 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
				placeholder="Enter SQL command..."
				disabled={isLoading}
			></textarea>
			<div class="flex flex-wrap items-center gap-4">
				<button
					type="submit"
					class="inline-flex items-center gap-2 bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
					disabled={isLoading}
				>
					{#if isLoading}
						<svg
							class="h-4 w-4 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"
							></circle>
							<path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"
							></path>
						</svg>
					{/if}
					Execute SQL
				</button>
				{#if error}
					<pre
						class="flex-1 overflow-auto border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error.replaceAll(
							'\\n',
							'\n',
						)}</pre>
				{/if}
				{#if result}
					<div
						class="flex flex-1 justify-between border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200"
					>
						<span>{result.took.toFixed(0)} ms</span>
						<span>{result.r.rowCount} rows</span>
					</div>
				{/if}
			</div>
		</form>
		{#if result}
			<!-- contain: paint isolates the scroll container's repaint area; without
				 it, scrolling a wide result table forces the whole page to repaint
				 every frame, which is what made horizontal scroll feel laggy. -->
			<div class="max-h-[600px] overflow-auto border border-slate-700 [contain:paint]">
				{#if result.r.rows && result.r.rows.length > 0}
					<table class="w-full border-collapse text-sm">
						<thead class="sticky top-0 z-10 bg-slate-700">
							<tr>
								{#each getHeaders(result.r.rows) as header, i (i)}
									<th class="border-b border-slate-600 px-3 py-2 text-left font-semibold text-slate-100"
										>{header}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each result.r.rows as row, r (r)}
								<!-- Solid stripe (no /50 alpha) so the GPU doesn't have to alpha-
									 composite every cell on every scroll frame. -->
								<tr class="even:bg-slate-900">
									{#each Object.values(row) as cell, c (c)}
										<td class="border-b border-slate-700 px-3 py-2 align-top text-slate-200">
											{#if typeof cell === 'object'}<pre class="text-xs text-slate-400">{JSON.stringify(
														cell,
														null,
														2,
													)}</pre>
											{:else}{cell === null ? 'null' : cell}{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300">
						No rows returned
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
