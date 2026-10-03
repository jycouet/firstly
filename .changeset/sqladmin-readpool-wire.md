---
'firstly': patch
---

sqlAdmin: reads now run as a read-only Postgres role upserted at boot (`readPool`, default `'auto'`, `false` to opt out, or your own pool); `tokens.pool` is removed. SQL and results now travel encoded (`ffsql1:`) from `<SqlAdmin />` and `ff-sql`, so WAF rules stop blocking them; plain SQL still works.
