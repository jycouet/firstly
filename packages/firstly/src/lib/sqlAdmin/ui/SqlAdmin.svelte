<script lang="ts">
  /**
   * SQL Admin UI.
   *
   * Results are logged to the browser console as `for AI: <json rows>` after
   * each successful query - chrome-devtools / AI agents inspecting the page
   * can read them with `list_console_messages`.
   */
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

  console.info('[firstly/SqlAdmin] AI Hint: results are also logged as "for AI:" JSON after each query.')

  function setPresetQuery(queryId: keyof typeof queries) {
    sqlInput = queries[queryId].sql
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    try {
      error = ''
      isLoading = true
      result = { ...(await SqlAdminController.exec(sqlInput)) }
      console.info('for AI:', JSON.stringify(result.r.rows))
      console.info('for humans:', result)
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

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    <h2 class="text-2xl font-bold">SQL Admin</h2>
    <p class="text-sm text-base-content/70">
      Execute SQL queries directly on the database. Results are displayed below and also logged to the browser console.
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    {#each Object.entries(queries) as [id, query] (id)}
      <button class="btn btn-outline btn-sm" onclick={() => setPresetQuery(id as keyof typeof queries)}>{query.label}</button>
    {/each}
  </div>
  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <fieldset class="fieldset">
      <textarea bind:value={sqlInput} class="textarea h-52 w-full font-mono" placeholder="Enter SQL command..." disabled={isLoading}></textarea>
    </fieldset>
    <div class="flex items-center gap-4">
      <button type="submit" class="btn btn-primary" disabled={isLoading}>
        {#if isLoading}<span class="loading loading-spinner"></span>{/if}
        Execute SQL
      </button>
      {#if error}<pre class="alert flex-1 text-sm alert-error">{error.replaceAll('\\n', '\n')}</pre>{/if}
      {#if result}
        <div class="alert flex flex-1 justify-between alert-success">
          <span class="text-success-content">{result.took.toFixed(0)} ms</span>
          <span class="text-success-content">{result.r.rowCount} rows</span>
        </div>
      {/if}
    </div>
  </form>
  {#if result}
    <div class="max-h-[600px] overflow-auto rounded-lg border border-base-300">
      {#if result.r.rows && result.r.rows.length > 0}
        <table class="table w-full table-zebra bg-base-200">
          <thead class="sticky top-0 z-10 bg-base-300">
            <tr>{#each getHeaders(result.r.rows) as header, i (i)}<th>{header}</th>{/each}</tr>
          </thead>
          <tbody>
            {#each result.r.rows as row, r (r)}
              <tr>
                {#each Object.values(row) as cell, c (c)}
                  <td class="align-top">
                    {#if typeof cell === 'object'}<pre class="text-xs">{JSON.stringify(cell, null, 2)}</pre>
                    {:else}{cell === null ? 'null' : cell}{/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="alert alert-info">No rows returned</div>
      {/if}
    </div>
  {/if}
</div>
