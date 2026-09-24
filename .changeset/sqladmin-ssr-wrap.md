---
'firstly': patch
---

sqlAdmin: server-only code is wrapped in `if (import.meta.env.SSR) { ... }`, so Vite 7 (Rollup) client builds no longer fail on `node:crypto` and the server helpers stay out of the client bundle.
