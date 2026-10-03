---
'firstly': minor
---

sqlAdmin: `readPool` option to run reads as a read-only Postgres role (`tokens.pool` deprecated). SQL and results now travel encoded (`ffsql1:`) from `<SqlAdmin />` and `ff-sql`, so WAF rules stop blocking them; plain SQL still works.
