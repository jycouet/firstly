# `firstly/evlog` - pre-merge TODO

Status: feature works and is merged up to date with `main`. The 3 correctness blockers, the
daisyUI→semantic-token restyle, and the doc fixes are **done** (2026-06-03). Remaining: a privacy
decision + scale follow-ups (none block correctness). Items cite `file:line`; findings came from a
verified multi-dimension review.

## Direction (build-vs-buy vs PostHog)

evlog and PostHog are **~80% complementary, not competitors**:

- **evlog** = "who changed which entity / what did this request do / which SQL ran", stored **in your
  own DB**, JOINable to Remult entities, gated by your roles.
- **PostHog** = "how do users use the product" (funnels, session replay, feature flags), stored in
  PostHog's own ClickHouse.

**Decision: continue evlog as a scoped backend audit/observability layer.** Don't grow it toward
product analytics - recommend PostHog Cloud (EU) as an optional, parallel front-end layer. (Now
stated in the README "Scope" note.)

## ✅ Done

- [x] **Denied-audit crash on a sampled-out 401/403** - `server/plugins/audit.ts`. Now reads
      `ctx.status` / `ctx.request` (always present) instead of off the nullable `ctx.event`; reproduced + fixed under TDD (`audit.spec.ts`, "event=null" test). Fixes both the crash and the
      silently-dropped denied row.
- [x] **`mountSqlSpans` double-records every query** - `server/sqlSpan.ts`. Second mount now
      early-returns (first mount stays active) instead of chaining onto its own wrapper.
      (`sqlSpan.spec.ts`).
- [x] **Cross-tenant write leak via `capturedDataProvider`** - `server/dataProviderCapture.ts`. Capture
      is now **first-wins** (never overwritten), so a concurrent request can't swap the provider out
      from under an in-flight detached drain. evlog now documents that it requires a STABLE
      dataProvider (per-request/multi-tenant is unsupported). (`dataProviderCapture.spec.ts`.)
- [x] **daisyUI → plain Tailwind + semantic tokens** for all 13 dashboard components
      (`EvlogStats.svelte` + `stats/*.svelte`) and the `routes/tasks` demo page; dropped the unused
      `daisyui` dep. Components were previously styled with daisy classes that this package no longer
      loads. (typecheck + 21 panel tests green.)
- [x] **Docs**: `withEvlog` JSDoc corrected to `{ evlog: { module } }`; README + controller JSDoc
      updated from the old `createUserAgentEnricher()` to `context: { userAgent: true }`; added
      "Migrating from changeLog", a "Scope" note (vs PostHog), and the stable-dataProvider constraint;
      `evlog.mdx` re-synced.

## Intentional - not a gap

- **Audit rows are never purged** - `server/remultDrains.ts`. Confirmed a deliberate design choice
  (immutable who-did-what log). README now states this explicitly and documents manual
  admin-side deletion for a GDPR Art.17 erasure. No code change needed.

## PII capture posture - decided: documented, kept as-is

Decision (2026-06-03): the verbatim-value capture is an accepted posture (like audit-never-purged),
**not** a code change. Documented in the README "What gets captured (and how to minimise it)" section:

- Audit diff values → already redactable per entity via `excludeColumns` / `excludeValues`.
- SQL `args` (`server/sqlSpan.ts`) → disable with `evlog({ sqlSpans: false })` or skip tables via
  `sqlSpans: { tablesToHide: [...] }`.
- Client `searchParams` (`EvlogClientController.ts`) → don't put secrets in query strings, or skip
  client tracing by not calling `initClientTrace()`.

All data stays in your own DB. No further action.

## 🟠 Scale follow-ups (don't block correctness; bite on growth)

- [ ] **No indexes on `(timestamp)` / `(traceId)`** for the `_ff_evlog_*` tables - `evlogEntities.ts`.
      Remult can't declare them in-entity → needs a migration (raw `CREATE INDEX`). Without it every
      `getStats` range-scan + boot purge is a full table scan.
- [ ] **`getStats` aggregates in JS** over up to ~300k rows, no `select` projection -
      `EvlogStatsController.ts:118-335`. Admin-only + one-shot today; push to SQL / add a projection
      above a row threshold.
- [ ] **Write amplification: 1 row per SQL query**, `minDurationMs` defaults to `0` -
      `server/plugins/trace.ts`. Consider defaulting `minDurationMs > 0` and/or capping `db_queries`.
- [ ] (nit) Hoist the per-query `await import('evlog/sveltekit')` to module scope -
      `server/sqlSpan.ts`.

## 🟡 Optional cleanups

- [ ] **3 Queries panels are ~95% copy-paste** (`stats/Queries{Hot,Slowest,TopTime}.svelte`); could
      collapse into one parametric panel. Six other panels share an unextracted card/`fmt`/empty-row
      skeleton.
- [ ] **Test-framework alignment (optional):** the `svelte-jsdom` vitest project + `@testing-library/svelte`
      still cover the panel tests in jsdom, while `main` uses Playwright browser mode for `*.svelte.spec.ts`.
      Works fine as-is; migrate only if you want to drop the 3-project superset.

## Notes

- External `evlog` pkg pinned at **2.18.1**; single-maintainer + young (~4 mo) - keep pinned and
  wrapped, watch breaking minors.
- One review finding ("audit `raw` duplicates unredacted changes") was **refuted** on verification -
  `raw` holds already-redacted data, no extra PII blast radius.
