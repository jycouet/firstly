---
'firstly': minor
---

Add `repoClient` (`firstly/svelte`) and `handleRepoClient` (`firstly/svelte/server`): `$derived(await repoClient(E).find())` in a component, API rules on SSR, no second query on hydration.
