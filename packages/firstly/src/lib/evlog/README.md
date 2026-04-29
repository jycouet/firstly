# Module - Evlog

Audit + request tracing + structured errors for Remult, built on top of [evlog](https://www.evlog.dev/).

Replaces the older `firstly/changeLog` table-write pattern with one logging surface that:

- emits **per-action audit events** (one wide event per entity create / update / delete) into `_ff_evlog_audit`
- emits **per-request wide events** (method, path, status, duration, SQL queries) into `_ff_evlog_trace`
- captures **client-side SPA navigations** as `source: 'client'` trace rows
- supports **structured errors** with `why` / `fix` / `link` so failures stay debuggable
- supports **fan-out drains** so the same events can also flow to Axiom / OTLP / Datadog / Sentry / file

## Why two tables?

Audit and trace have different retention stories:

- `_ff_evlog_audit` - "who did what". Permanent. No TTL. Optionally signed / hash-chained for compliance.
- `_ff_evlog_trace` - "what hit the server". Operational. Can be TTL'd and sampled.

Mixing them makes retention policies fight each other. Keeping them split keeps the schema legible.

## Installation

```bash
npm add firstly@latest
```

`evlog` ships transitively - you do not need to install it directly.

## Setup

Three pieces:

1. Register the module in your `remultApi` config
2. Wire the SvelteKit handle so `useLogger()` resolves inside route handlers
3. (Optional) Hook client-side navigations from your root layout

```ts
// src/server/api.ts
import { remultApi } from 'remult/remult-sveltekit'
import { evlog } from 'firstly/evlog/server'

export const api = remultApi({
	dataProvider: /* your provider */,
	modules: [
		evlog({ service: 'my-app' }),
		// ...other modules
	],
})
```

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks'
import { evlogHandle } from 'firstly/evlog/server'
import { api as handleRemult } from './server/api'

// evlogHandle MUST come before handleRemult so useLogger() resolves
// inside Remult lifecycle hooks and BackendMethod handlers.
export const handle = sequence(evlogHandle(), handleRemult)
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { initClientTrace } from 'firstly/evlog'
	initClientTrace()
</script>
```

## Usage - audit on entities

Wrap entity options with `withEvlog` (mirrors `withChangeLog`'s shape). Tag the owning module so the audit row carries it:

```ts
import { Entity, Fields, Allow } from 'remult'
import { withEvlog } from 'firstly/evlog'

@Entity<Task>(
	'tasks',
	withEvlog({
		allowApiCrud: Allow.everyone,
		evlog: { module: 'tasks' },
	}),
)
export class Task {
	@Fields.id() id = ''
	@Fields.string() title = ''
	@Fields.boolean() completed = false
}
```

Every save / delete now produces one `audit()` event with `action: 'tasks.create' | 'tasks.update' | 'tasks.delete'`, the actor (`remult.user`), the target (`{ type: 'tasks', id }`), and a JSON Patch `changes.patch[]` array.

### Excluding fields

```ts
withEvlog({
	evlog: {
		module: 'users',
		excludeColumns: (f) => [f.passwordHash],     // skip entirely
		excludeValues: (f) => [f.dob, f.ssn],        // log key+op but value -> "[REDACTED]"
	},
})
```

### Opting out per-entity

```ts
withEvlog({ evlog: false })
```

## Usage - structured errors

```ts
import { createError } from 'firstly/evlog'

throw createError({
	status: 403,
	message: 'Cannot refund - invoice already settled',
	why: 'Settlement runs nightly; once an invoice is in the batch it cannot be reversed.',
	fix: 'Issue a credit note instead via /admin/credit-notes.',
	link: 'https://docs.example.com/refunds#post-settlement',
})
```

Remult turns thrown errors into JSON responses, which means `evlog`'s SvelteKit handle never sees the throw. To get the structured fields onto the trace wide event, attach them explicitly inside the controller before throwing:

```ts
import { useLogger } from 'evlog/sveltekit'

const err = createError({ ... })
useLogger().error(err)
useLogger().set({ error: { why: err.why, fix: err.fix, link: err.link, status: err.status } })
throw err
```

The frontend can read the same fields on the rejected response from the BackendMethod call.

## Usage - SQL spans

Enabled by default. Each query becomes an entry in `event.db_queries[]` on the parent request's wide event:

```json
{
	"db_queries": [
		{ "sql": "select ...", "duration": 0.4, "args": {} },
		{ "sql": "update ...", "duration": 0.6, "args": { ":0": "..." } }
	]
}
```

Disable or filter:

```ts
evlog({
	sqlSpans: false,                                          // off
	// or:
	sqlSpans: { tablesToHide: ['cache'], minDurationMs: 1 },  // tune
})
```

The audit / trace tables themselves are auto-skipped (and a request-scoped suppression flag stops the drain's own writes from re-emitting and looping).

## Configuration

```ts
evlog({
	service: 'my-app',
	environment: 'production',                  // defaults to NODE_ENV
	audit: {
		enabled: true,                            // default true; set false to disable audit storage
		entity: MyAuditEntity,                    // override for side-by-side migration
	},
	trace: {
		enabled: true,
		entity: MyTraceEntity,
		skipPaths: ['/api/health', '/api/_lq*'],  // exact match or trailing-* prefix match
		retentionDays: 30,                        // TODO not yet enforced - planned TTL job
	},
	drains: [
		// fan out alongside the Remult drains
		// import { createAxiomDrain } from 'evlog/axiom'
		// createAxiomDrain({ token: process.env.AXIOM_TOKEN, dataset: 'my-app' }),
	],
	sqlSpans: true,                             // see above
})
```

### Enrich events (browser, geo, request size, ...)

`evlog` ships built-in enrichers that mutate every wide event before it reaches the drain. Wire them through `evlogHandle({ enrich })` - nothing is on by default.

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks'
import { evlogHandle } from 'firstly/evlog/server'
import {
	createUserAgentEnricher,
	createGeoEnricher,
	createRequestSizeEnricher,
	createTraceContextEnricher,
} from 'evlog/enrichers'
import { api as handleRemult } from './server/api'

const enrichers = [
	createUserAgentEnricher(),    // event.userAgent = { raw, browser, os, device }
	createGeoEnricher(),          // event.geo       = { country, region, city, ... } (Vercel/CF headers)
	createRequestSizeEnricher(),  // event.requestSize
	createTraceContextEnricher(), // event.traceContext + event.traceId/spanId
]

export const handle = sequence(
	evlogHandle({
		enrich: (ctx) => {
			for (const e of enrichers) e(ctx)
		},
	}),
	handleRemult,
)
```

The fields land on `_ff_evlog_trace.event` (JSON column). Query them with the JSON ops your dialect provides - in Postgres:

```sql
select event->'userAgent'->'browser'->>'name' as browser, count(*)
from _ff_evlog_trace
group by 1 order by 2 desc;
```

`<EvlogStats>` already does this aggregation in JS, so no SQL needed for the demo dashboard.

> **Note on SPA navigations.** `EvlogClientController.recordNavigation()` emits its own wide event via `createLogger().emit()`. The enrichers above run on the SvelteKit *request*'s aggregate event, so the navigation row may not pick them up depending on how evlog flushes. If you need browser data on client navs specifically, pass `navigator.userAgent` from the client and store it on the event yourself.

## Display stats

Two ways to use the stats UI: the all-in-one orchestrator, or pick the panels you want.

### All-in-one - `<EvlogStats>`

Drop it anywhere a logged-in admin can reach. It calls `EvlogStatsController.getStats(year)` once, which fetches `_ff_evlog_audit` + `_ff_evlog_trace` for the year and aggregates in JS - dialect-agnostic, works on Postgres / SQLite / anything Remult drives. Built-in year selector + Refresh button.

```svelte
<script lang="ts">
	import { EvlogStats } from 'firstly/evlog'
</script>

<EvlogStats />
<!-- or pin the year / cap rows -->
<EvlogStats year={2026} rowLimit={50_000} />
```

### Pick and choose

Each panel is a standalone component that takes its data as a prop. Fetch once in the parent, pass slices to whichever panels you want. Use `<EvlogStatsHeader>` for the year selector + Refresh button.

```svelte
<script lang="ts">
	import { onMount } from 'svelte'
	import {
		EvlogStatsController,
		EvlogStatsHeader,
		EvlogStatsTotals,
		EvlogStatsQueriesHot,
		type EvlogStatsData,
	} from 'firstly/evlog'

	let year = $state(new Date().getFullYear())
	let stats = $state<EvlogStatsData | null>(null)
	let loading = $state(false)

	async function load() {
		loading = true
		stats = await EvlogStatsController.getStats(year)
		loading = false
	}
	onMount(load)
</script>

<EvlogStatsHeader bind:year {loading} onRefresh={load} title="My dashboard" />

{#if stats}
	<EvlogStatsTotals data={stats.totals} year={stats.year} />
	<EvlogStatsQueriesHot data={stats.queries.hottest} />
{/if}
```

### Available panels

| Component | Data prop | Shows |
|---|---|---|
| `<EvlogStatsHeader>` | (own state) | Year selector + Refresh button + spinner. `bind:year`, `loading`, `onRefresh`, optional `title`. |
| `<EvlogStatsTotals>` | `data: stats.totals`, `year` | Traces, audits, unique actors. |
| `<EvlogStatsTraces>` | `data: stats.monthlyTraces` | Per-month traces, server vs client (SPA navs) split. |
| `<EvlogStatsCrud>` | `data: stats.monthlyAudits` | Per-month creates / updates / deletes (parsed from `action` verb suffix). |
| `<EvlogStatsModules>` | `data: stats.monthlyByModule` | Events per `module` per month - tag emits with `module: 'reports'` to slice. |
| `<EvlogStatsTopPages>` | `data: stats.topPages` | Most-visited pathnames (client navs). |
| `<EvlogStatsPageFlows>` | `data: stats.pageFlows` | Top from→to navigation pairs (LAG by `actorId`). |
| `<EvlogStatsBrowsers>` | `data: stats.browsers` | Browser %, requires `createUserAgentEnricher()` wired. |
| `<EvlogStatsOsDevices>` | `os`, `devices` | OS + device breakdown (same enricher). |
| `<EvlogStatsQueriesSlowest>` | `data: stats.queries.slowest` | Top 10 SQL by `max(duration)` - one-off pathological queries. |
| `<EvlogStatsQueriesTopTime>` | `data: stats.queries.mostTime` | Top 10 SQL by `sum(duration)` - fast-but-frequent killers. |
| `<EvlogStatsQueriesHot>` | `data: stats.queries.hottest` | Top 10 SQL by call count - good for spotting N+1. |

### SQL query stats - what they tell you

The three `EvlogStatsQueries*` panels read `event.db_queries[]` (populated by `mountSqlSpans`) across the year's traces. Each row shows the parameterized SQL, the relevant metric, count / total / max / avg, and the **top 3 trace paths that triggered it**. So if `update tasks set completed = ... where id = ...` shows up 12 times under `/api/setAllCompleted`, that's a textbook N+1 sitting in plain sight.

Queries are deduped by exact SQL string. Remult emits parameterized SQL (`select ... where id = $1`) with `args` separate, so no normalizer is needed - but if your code does raw `SqlDatabase.execute(`select ... where id = ${userId}`)` interpolation, those rows look unique per call and won't aggregate.

### Performance

`getStats` does one `repo.find()` per table, capped at `rowLimit` (default 100k). Aggregation is in JS. For high-volume systems where fetching 100k rows is too much, subclass `EvlogStatsController` and replace `getStats` with a dialect-specific SQL view.

### Side-by-side migration

The default tables are `_ff_evlog_audit` and `_ff_evlog_trace`, which collide with **nothing** in the existing firstly + prevention + dp-my-minion ecosystem. So you can run them in parallel with the legacy `_ff_change_logs` / `_ff_traces` / `traces` setups for as long as you need.

If you ever do need a different table name, subclass the entity and pass it in:

```ts
import { Entity } from 'remult'
import { EvlogTrace } from 'firstly/evlog'

@Entity('evlog_traces_v2', { /* ... copy options ... */ })
class MyTrace extends EvlogTrace {}

evlog({ trace: { entity: MyTrace } })
```

## Roles

`Roles_Evlog.Evlog_Admin` controls **insert** and **delete** on the storage entities. **Read** is open by default so dashboards can surface the data; lock it down by subclassing the entity and adjusting `allowApiRead` if you need to.

## Re-exported from `evlog`

`firstly/evlog` re-exports the bits you are most likely to want:

```ts
import {
	createError, parseError,
	auditDiff, defineAuditAction, AuditDeniedError, AUDIT_SCHEMA_VERSION,
} from 'firstly/evlog'
import type {
	WideEvent, BaseWideEvent, AuditFields, AuditInput, AuditActor,
	AuditTarget, AuditPatchOp, AuditDiffOptions, DrainContext, DrainFn,
	ErrorOptions, LogLevel,
} from 'firstly/evlog'
```

You should not need to install `evlog` separately.
