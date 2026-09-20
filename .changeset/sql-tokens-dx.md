---
'firstly': patch
---

sqlAdmin: failed queries now carry Postgres' HINT (or the closest catalog names) and the SQLSTATE, so `column a.analysisversion does not exist` comes back with `Did you mean "activities"."analysisVersion"?`. New `ff-sql` bin to run token SQL from a terminal (`--origin=`, `--api-path=`, `--json`, stdin, `FF_SQL_TOKEN`/`FF_SQL_ORIGIN`); the mint screen now copies the full command, so there is nothing to set up. Tokens can be named automatically (`swift-otter-3f9`); a dead token can be deleted - one by one, or every one of them via `purgeTokens()` - which takes its call log with it, while a revoke keeps it.
