---
"firstly": minor
---

svelte: add `stackHandleClientError(...middlewares)` and a `withStaleDeployReload()` middleware for `hooks.client.js`, mirroring `stackHttpClient`. Stack your own error handlers alongside stale-deploy recovery: `withStaleDeployReload` hard-reloads once on a chunk-load failure (time-boxed guard, no reload loop), trusting the failure signal instead of `updated.check()` (which lies behind a CDN caching `version.json`).
