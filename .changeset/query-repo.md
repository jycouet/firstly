---
'firstly': minor
---

Add experimental `queryRepo` (`firstly/svelte/query`, Kit 3): `$derived(await queryRepo(E).find())` with API rules on SSR, no query on hydration, and plain `repo(E)` writes refreshing it. Published JSDoc samples keep their `firstly/...` imports.
