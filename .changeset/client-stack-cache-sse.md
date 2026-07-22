---
'firstly': minor
---

feat: `withShortTermCache` http middleware (dedupes identical read requests within a TTL) and `stackSubscriptionClient` + `withTabSharing` (one shared SSE connection across tabs via `navigator.locks`, with liveQuery resync on leader handoff and reconnect)
