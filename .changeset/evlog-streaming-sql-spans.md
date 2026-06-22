---
'firstly': patch
---

`firstly/evlog`: stop SQL-span capture from warning on streaming responses. Queries that run after the response is produced (notably remult liveQuery SSE re-runs) can no longer attach to the already-emitted wide event, so they are now skipped cleanly instead of triggering evlog's `log.set() called after the wide event was emitted - Keys dropped: db_queries` warning.
