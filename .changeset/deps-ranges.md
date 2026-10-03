---
'firstly': patch
---

Dependencies are `^` ranges instead of exact pins, so apps share one copy of each with their own deps. `tailwindcss` is no longer a dependency (firstly never imports it). `vite-plugin-kit-routes` 1.1.1 and `vite-plugin-stripper` 0.10.6 publish ranges too, so `@kitql/*` and `esrap` dedupe as well.
