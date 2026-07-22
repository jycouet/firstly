---
"firstly": minor
---

svelte: add `ffHandleError`, a composable `handleError` for `hooks.client.js` that recovers stale-deploy chunk-load failures with a one-shot hard reload (time-boxed guard, no reload loop) and delegates every other error to your own `onError`. Trusts the failure signal instead of `updated.check()`, which lies behind a CDN caching `version.json`.
