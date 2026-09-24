---
'firstly': patch
---

feedback & carbone: BackendMethod bodies are wrapped in `if (import.meta.env.SSR) { ... }`, so their server code (GitHub GraphQL queries, Carbone calls) no longer ships in the client bundle.
