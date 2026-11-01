---
'firstly': minor
---

SvelteKit 3 only (Node 22.17+), stay on `0.11.x` for Kit 2. `SP` navigates with `replace: true, reset: false`: drop `keepFocus`, `noScroll` and `replaceState` from `gotoOpts`. `firstly()` sets legacy decorators and nullifies `$app/env/private` on the client. `withStaleDeployReload` reads Kit 3's `handleError` input.
