---
'firstly': minor
---

sqlAdmin: `readPool: 'auto'` upserts a read-only Postgres role at boot and runs reads through it (or pass your own pool); `tokens.pool` is removed. SQL and results now travel encoded (`ffsql1:`) from `<SqlAdmin />` and `ff-sql`, so WAF rules stop blocking them; plain SQL still works.
