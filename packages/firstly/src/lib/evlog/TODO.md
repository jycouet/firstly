# `firstly/evlog` - pre-merge TODO

Status: **feature works and is merged up to date with `main` (`f427af5`), but is NOT yet mergeable
to `main`.** Below are the blockers and follow-ups from a verified multi-dimension review
(2026-06-03, post-merge). Each item cites `file:line` and was adversarially verified against the
actual code.

## Direction (build-vs-buy vs PostHog)

evlog and PostHog are **~80% complementary, not competitors**:

- **evlog** = "who changed which entity / what did this request do / which SQL ran", stored **in your
  own DB**, JOINable to Remult entities, gated by your roles.
- **PostHog** = "how do users use the product" (funnels, session replay, feature flags), stored in
  PostHog's own ClickHouse.

**Decision: continue evlog as a scoped backend audit/observability layer. Do NOT grow it toward
product analytics** - point consumers at PostHog Cloud (EU) as an optional, parallel front-end layer.
PostHog's OSS self-host is officially hobby/eval-only and cannot produce evlog's in-DB
entity-joined audit / per-SQL-query traces.

> TODO: add a short README "Scope" section stating evlog is not a product-analytics tool and
> recommending PostHog Cloud (EU) alongside it for that need.

---

## 🔴 Blockers - correctness (crash / data corruption)

- [ ] **Denied-audit crashes on a sampled-out 401/403** - `server/plugins/audit.ts:62-68`.
      `ctx.event` is `WideEvent | null` and is genuinely `null` when the request's wide event is
      dropped by tail sampling. The handler does `evt.status` with no null guard → `TypeError`. The
      handler is `async` but the host calls it synchronously inside a sync try/catch, so the throw
      becomes an **uncatchable unhandled rejection**.
      **Fix:** early-out `if (!ctx.event) return`, and read **`ctx.status`** (always present) instead
      of `evt.status`. This also fixes the related finding below in one go.
- [ ] **Denied row reads HTTP status from the wrong source** - `server/plugins/audit.ts:65`. Even
      without the crash, a sampled-out 401/403 silently emits no denied-audit row (the headline
      reason this hook exists). Use `ctx.status`, not `evt.status`.
- [ ] **`mountSqlSpans` double-registration double-records every query** -
      `server/sqlSpan.ts:20-37`. The `mounted` guard warns "the second call overrides the first" but
      does not return - it re-wraps and chains, so on HMR / a double `evlog()` registration every
      query is written **twice** (duplicate `_ff_evlog_trace_query` rows + inflated hottest/most-time
      stats). **Fix:** early-return on `mounted` (or genuinely restore-then-replace).
- [ ] **Cross-tenant write leak via shared `capturedDataProvider` singleton** -
      `server/dataProviderCapture.ts:10`. The module-level `let` is reassigned per request; drains
      run after `resolve()`, so a concurrent request B can overwrite it between request A's resolve
      and A's drain → A's audit/trace rows written into B's tenant DB. Only manifests with
      Remult per-request `dataProvider` (multi-tenant), which firstly does not ship by default.
      **Fix:** bind the per-request dataProvider into the detached drain context, **or** explicitly
      document multi-DP as unsupported and guard.

## 🔴 Blockers - privacy / GDPR (shipping these defaults is a liability)

- [ ] **Audit rows are never purged** - `server/remultDrains.ts:18-24`. No retention, no TTL, no
      subject-scoped delete for `_ff_evlog_audit` (trace/query are purged; audit intentionally is
      not). Combined with PII capture below, personal data accumulates indefinitely with no
      Art.5(1)(e) storage-limitation or Art.17 erasure path.
      **Fix:** ship a documented operator retention story for `_ff_evlog_audit` + a subject-scoped
      delete helper.
- [ ] **Verbatim PII captured by default in three places** (redaction is fully opt-in):
  - audit diff values - `withEvlog.ts:48-94` (before/after of every changed field)
  - **SQL bound-param `args`** - `server/sqlSpan.ts:60-71` (every queried table, **on by default**)
  - **client `searchParams`** - `EvlogClientController.ts:43-52` (whole query string: `?token=`,
    `?email=`, …, **no allowlist/redaction**)

    **Fix:** make the capture posture prominent in docs, add a global redaction/allowlist knob, and
    consider defaulting `args` + `searchParams` capture **off or redacted**.

## 🟠 Before any consumer scales (won't block an admin-only dashboard, will bite on growth)

- [ ] **Add indexes on `(timestamp)` and `(traceId)`** for all three `_ff_evlog_*` tables -
      `evlogEntities.ts`. Remult exposes no in-entity index option, so this needs a documented
      migration (raw `CREATE INDEX`). Without it, every `getStats` range-scan and every boot purge is
      a full table scan.
- [ ] **`getStats` aggregates in JS over up to ~300k rows** - `EvlogStatsController.ts:118-335`.
      Three unconstrained `find({ limit: 100_000 })` calls, no `select` projection (drags full JSON
      columns into heap), then ~6 full-array scans. Admin-only + one-shot, but one click can pin a
      core. Push aggregation into SQL (or add a `select` projection) above some row threshold.
- [ ] **Write amplification: 1 row per SQL query, unbounded per request** -
      `server/plugins/trace.ts:136-149`. `minDurationMs` defaults to `0` (capture every query).
      Default `minDurationMs > 0` and/or cap `db_queries` length per request.
- [ ] (nit) Hoist the per-query `await import('evlog/sveltekit')` to module scope -
      `server/sqlSpan.ts:59`.

## 🟡 DX / docs quick wins (cheap, do now)

- [ ] **`withEvlog` JSDoc example is wrong** - `withEvlog.ts:112`. Shows `withEvlog({ module: 'task' })`
      but `module` lives under `evlog`: `withEvlog({ evlog: { module: 'task' } })`. Copy-pasting the
      JSDoc silently breaks module tagging.
- [ ] **README/JSDoc still reference the old `createUserAgentEnricher()`** -
      `README.md:392`, `EvlogStatsController.ts:114`. Align to the new
      `context: { userAgent: true }` opt-in.
- [ ] **Missing "Migrating from changeLog" README section** that the `@deprecated` JSDoc promises -
      `changeLog/index.ts:144`. Document: old `_ff_change_logs` stays readable, the two run
      side-by-side (different tables/roles), old data is not backfilled.
- [ ] **3 Queries panels are ~95% copy-paste** - `stats/QueriesSlowest.svelte` /
      `QueriesTopTime.svelte` / `QueriesHot.svelte`. Collapse into one parametric
      `<EvlogStatsQueries>` (only sort + accent color vary). Six other panels share an unextracted
      card + `fmt` + empty-row skeleton (`fmt` redeclared ~11x, `monthLabel` duped 3x).

## 🧹 Branch-alignment debt (introduced by the `main` merge)

`main` (#289) removed daisyUI and migrated Svelte tests jsdom → Playwright; evlog predates both. The
merge kept evlog working via a **superset** (3-project vitest config; daisyUI/jsdom retained). To
merge cleanly into `main`:

- [ ] Restyle the **12 dashboard components** (`EvlogStats.svelte` + `stats/*.svelte`) off daisyUI
      classes (`card`, `btn`, `badge`, `bg-base-100`, `text-base-content`, …) to plain Tailwind +
      the semantic tokens `main` adopted.
- [ ] Once restyled, drop the `svelte-jsdom` vitest project + daisyUI/jsdom/@testing-library deps and
      migrate `panels.spec.ts` / `EvlogStats.spec.ts` to `main`'s Playwright browser approach
      (`*.svelte.spec.ts`).

---

## Notes

- Correctness blockers (audit crash, sqlSpan double-record) are the quickest, highest-value wins.
- The privacy defaults are the single biggest reason a privacy-conscious consumer would reject the
  feature - treat as a design decision, not just a patch.
- One review finding ("audit `raw` duplicates unredacted changes") was **refuted** on verification -
  `raw` holds already-redacted data, no extra PII blast radius.
- External `evlog` pkg pinned at **2.18.1**; single-maintainer + young (~4 mo) - keep pinned and
  wrapped, watch breaking minors.
