<script lang="ts">
	/**
	 * SQL Admin UI.
	 *
	 * Styled with raw Tailwind utilities only - no plugin (daisyUI, shadcn, etc.)
	 * required. Drop into any Tailwind-powered project and it just works.
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

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold">SQL Admin</h2>
		<p class="text-sm text-zinc-600">
			Execute SQL queries directly on the database. Results are displayed below and also logged to the
			browser console.
		</p>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each Object.entries(queries) as [id, query] (id)}
			<button
				type="button"
				class="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
				onclick={() => setPresetQuery(id as keyof typeof queries)}>{query.label}</button
			>
		{/each}
	</div>
	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<textarea
			bind:value={sqlInput}
			class="h-52 w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
			placeholder="Enter SQL command..."
			disabled={isLoading}
		></textarea>
		<div class="flex items-center gap-4">
			<button
				type="submit"
				class="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
					class="flex-1 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error.replaceAll(
						'\\n',
						'\n',
					)}</pre>
			{/if}
			{#if result}
				<div
					class="flex flex-1 justify-between rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900"
				>
					<span>{result.took.toFixed(0)} ms</span>
					<span>{result.r.rowCount} rows</span>
				</div>
			{/if}
		</div>
	</form>
	{#if result}
		<div class="max-h-[600px] overflow-auto rounded-lg border border-zinc-200">
			{#if result.r.rows && result.r.rows.length > 0}
				<table class="w-full border-collapse text-sm">
					<thead class="sticky top-0 z-10 bg-zinc-100">
						<tr>
							{#each getHeaders(result.r.rows) as header, i (i)}
								<th class="border-b border-zinc-200 px-3 py-2 text-left font-semibold text-zinc-700"
									>{header}</th
								>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each result.r.rows as row, r (r)}
							<tr class="even:bg-zinc-50">
								{#each Object.values(row) as cell, c (c)}
									<td class="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
										{#if typeof cell === 'object'}<pre class="text-xs">{JSON.stringify(cell, null, 2)}</pre>
										{:else}{cell === null ? 'null' : cell}{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<div class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
					No rows returned
				</div>
			{/if}
		</div>
	{/if}
</div>
