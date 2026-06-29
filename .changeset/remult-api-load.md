---
"firstly": minor
---

Add `remultApiUniversalLoad` (`firstly/svelte`) and `remultApiServerLoad` (`firstly/svelte/server`): wrap a SvelteKit load so plain `repo()` reads apply the entity's API rules (`allowApiRead` / `apiPrefilter`) as the current user. The universal one binds to `event.fetch` (SSR + CSR); the server one dispatches in-process via `TestApiDataProvider`.
