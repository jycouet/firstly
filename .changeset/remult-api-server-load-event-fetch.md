---
'firstly': patch
---

`remultApiServerLoad` reads through `event.fetch` instead of `TestApiDataProvider`: concurrency-safe on released remult (no process-global static swap), and the API side runs the app's real auth/hooks.
