---
'firstly': patch
---

sqlAdmin: failed queries now carry Postgres' HINT (or the closest catalog names) and the SQLSTATE, so `column a.analysisversion does not exist` comes back with `Did you mean "activities"."analysisVersion"?`. New `ff-sql` bin to run token SQL from a terminal (`FF_SQL_TOKEN`, `FF_SQL_ORIGIN`, `--json`, stdin). Tokens can be named automatically (`swift-otter-3f9`) and deleted - one by one, or every dead one via `purgeTokens()`; a delete takes the token's call log with it, a revoke keeps it.
