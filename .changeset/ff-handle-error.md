---
"firstly": minor
---

svelte: add `ffHandleError(onError?)`, a composable `handleError` for `hooks.client.js`. It hard-reloads once on a stale-deploy chunk-load failure (time-boxed guard, no reload loop) and delegates every other error to your handler. Trusts the failure signal instead of `updated.check()`, which lies behind a CDN caching `version.json`.
