---
'firstly': patch
---

Add `handleCaching` (`firstly/svelte/server`): a `hooks.server.js` handle setting deploy-safe `Cache-Control` headers - immutable for `/_app/immutable/*` 200s, no-store for HTML/API and all non-200s (a cached 404 chunk would brick the client until "disable cache").
