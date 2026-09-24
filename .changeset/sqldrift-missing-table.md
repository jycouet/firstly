---
'firstly': patch
---

sqlAdmin drift: entities in a non-`public` schema (e.g. `ff_auth.ba-accounts`) are checked in their own schema, a table not created yet is reported as `missing` instead of failing the whole apply, and errors show the real message and failing statement (no more `[object Object]`).
