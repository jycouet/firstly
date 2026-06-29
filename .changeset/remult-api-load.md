---
"firstly": minor
---

Add `remultApiUniversalLoad` (`firstly/svelte`) and `remultApiServerLoad` (`firstly/svelte/server`): wrap a SvelteKit load so plain `repo()` reads apply the entity's API rules (`allowApiRead` / `apiPrefilter`) as the current user, on SSR and CSR.
