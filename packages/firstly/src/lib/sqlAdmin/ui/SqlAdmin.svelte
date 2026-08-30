<script lang="ts">
	/**
	 * SQL Admin UI.
	 *
	 * Styled against the semantic theme tokens (`bg-card`, `text-foreground`,
	 * `border-border`, `bg-primary`, `bg-destructive`, ...) defined by the host
	 * app, so it inherits the userland theme instead of a hard-coded palette.
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
	let result: { rows: any[]; rowCount: number; took: number } | undefined = $state()
	let error = $state('')
	let isLoading = $state(false)
	let notReadOnly = $state(false)
	let copied = $state(false)

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
			result = await SqlAdminController.exec(sqlInput, notReadOnly)
			log.info('for AI:', JSON.stringify(result.rows))
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

	function cellToText(cell: unknown): string {
		if (cell === null || cell === undefined) return ''
		if (typeof cell === 'object') return JSON.stringify(cell)
		return String(cell)
	}

	/** Render the result as a GitHub-flavoured markdown table (paste into a chat). */
	function toMarkdown(rows: any[]): string {
		const headers = getHeaders(rows)
		if (headers.length === 0) return ''
		const esc = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n', ' ')
		const head = `| ${headers.map(esc).join(' | ')} |`
		const sep = `| ${headers.map(() => '---').join(' | ')} |`
		const body = rows
			.map((row) => `| ${headers.map((h) => esc(cellToText(row[h]))).join(' | ')} |`)
			.join('\n')
		return `${head}\n${sep}\n${body}`
	}

	async function copyTable() {
		if (!result?.rows?.length) return
		try {
			await navigator.clipboard.writeText(toMarkdown(result.rows))
			copied = true
			setTimeout(() => (copied = false), 1500)
		} catch (e) {
			log.error('copy failed', e)
		}
	}
</script>

<div class="border border-border bg-card text-card-foreground">
	<header class="border-b border-border px-5 py-4">
		<h2 class="text-lg font-semibold text-foreground">SQL Admin</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Execute SQL queries directly on the database. Results are displayed below and also logged to the
			browser console.
		</p>
	</header>

	<div class="flex flex-col gap-4 p-5">
		<div class="flex flex-wrap gap-2">
			{#each Object.entries(queries) as [id, query] (id)}
				<button
					type="button"
					class="border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
					onclick={() => setPresetQuery(id as keyof typeof queries)}>{query.label}</button
				>
			{/each}
		</div>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<textarea
				bind:value={sqlInput}
				class="h-52 w-full border border-input bg-background p-3 font-mono text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
				placeholder="Enter SQL command..."
				disabled={isLoading}
			></textarea>
			<div class="flex flex-wrap items-center gap-4">
				<button
					type="submit"
					class="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
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

				<label
					class="inline-flex items-center gap-2 text-sm font-medium select-none"
					class:text-destructive={notReadOnly}
					class:text-muted-foreground={!notReadOnly}
					title="Read-only runs your query in a READ ONLY transaction so the database rejects any write. Tick this only when you know what you are doing."
				>
					<input type="checkbox" bind:checked={notReadOnly} class="accent-destructive" />
					{notReadOnly ? 'Writes enabled (I know what I am doing)' : 'Read-only'}
				</label>

				{#if error}
					<pre
						class="flex-1 overflow-auto border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error.replaceAll(
							'\\n',
							'\n',
						)}</pre>
				{/if}
				{#if result}
					<div
						class="flex flex-1 items-center justify-between gap-3 border border-border bg-muted p-3 text-sm text-muted-foreground"
					>
						<span>{result.took.toFixed(0)} ms</span>
						<span>{result.rowCount} row{result.rowCount === 1 ? '' : 's'}</span>
					</div>
				{/if}
			</div>
		</form>
		{#if result}
			{#if result.rows && result.rows.length > 0}
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">
						{result.rowCount} row{result.rowCount === 1 ? '' : 's'}
					</span>
					<button
						type="button"
						onclick={copyTable}
						class="inline-flex items-center gap-2 border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
					>
						{copied ? 'Copied!' : 'Copy as markdown'}
					</button>
				</div>
			{/if}
			<!-- contain: paint isolates the scroll container's repaint area; without
				 it, scrolling a wide result table forces the whole page to repaint
				 every frame, which is what made horizontal scroll feel laggy. -->
			<div class="max-h-[600px] overflow-auto border border-border [contain:paint]">
				{#if result.rows && result.rows.length > 0}
					<table class="w-full border-collapse text-sm">
						<thead class="sticky top-0 z-10 bg-secondary">
							<tr>
								{#each getHeaders(result.rows) as header, i (i)}
									<th
										class="border-b border-border px-3 py-2 text-left font-semibold text-secondary-foreground"
										>{header}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each result.rows as row, r (r)}
								<tr class="even:bg-muted/40">
									{#each Object.values(row) as cell, c (c)}
										<!-- min-w to keep short cells readable, max-w-xs to cap
											 wide ones, break-all so long unbroken strings (URLs,
											 DIDs) wrap inside their cell instead of forcing the
											 column too wide and making horizontal scroll laggy. -->
										<td
											class="max-w-xs min-w-[8rem] border-b border-border px-3 py-2 align-top text-sm break-all text-foreground"
										>
											{#if typeof cell === 'object' && cell !== null}<pre
													class="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(
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
					<div class="bg-card p-3 text-sm text-muted-foreground">No rows returned</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
