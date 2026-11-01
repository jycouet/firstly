---
'firstly': minor
---

SvelteKit 3 only (Node 22.17+), stay on `0.11.x` for Kit 2. `SP` navigates with `replace: true, reset: false`: drop `keepFocus`, `noScroll` and `replaceState` from `gotoOpts`. `$app/env/private` is nullified on the client, and `withStaleDeployReload` reads Kit 3's `handleError` input.
