---
'firstly': minor
---

Add experimental `queryRepo` (`firstly/svelte/query`): `$derived(await queryRepo(E).find())` with API rules on SSR, no query on hydration, and plain `repo(E)` writes refreshing it.
