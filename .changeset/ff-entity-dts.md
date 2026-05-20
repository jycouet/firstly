---
'firstly': patch
---

fix(core): add explicit return type to `FF_Entity` so its `.d.ts` is emitted.

The inferred return type referenced a non-portable remult internal, so svelte-package silently skipped generating `FF_Entity.d.ts`. Consumers using the published package got `FF_Entity` typed as `any`, which made every entity option callback (`saving`, `displayValue`, ...) implicitly `any`.
