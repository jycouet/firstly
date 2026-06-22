---
'firstly': minor
---

Add `firstly/evlog` module: audit + request tracing + structured errors for Remult, built on [evlog](https://www.evlog.dev/). Replaces the older `firstly/changeLog` table-write pattern (now JSDoc-deprecated) with `withEvlog` / `evlog()` and a `<EvlogStats />` admin panel. Ships `firstlyAuditPlugin`, `firstlyTracePlugin`, `throwLogged()` for structured `BackendMethod` errors, and a boot-time purge for trace rows.
