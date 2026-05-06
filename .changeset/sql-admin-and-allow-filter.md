---
'firstly': patch
---

Add `firstly/sqlAdmin` module: a drop-in `<SqlAdmin />` Svelte component plus a `BackendMethod` controller gated by `Roles_SqlAdmin.SqlAdmin_Admin` (or `FF_Role.FF_Role_Admin`). The component ships with prefilled queries (DB size, table sizes, indexes) and logs results as `for AI: <rows>` to the browser console for chrome-devtools / AI-agent inspection. `sqlAdmin({ path })` logs an AI hint on server start pointing to the page (default `/sql/admin`).

Add `FF_Allow` and `FF_Filter` helpers (exported from `firstly`) for owner-only / admin-or-owner row checks and prefilters - usable in `allowApi*` and `apiPrefilter`.
