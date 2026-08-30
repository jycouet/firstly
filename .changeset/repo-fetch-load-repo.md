---
"firstly": minor
---

svelte: added `repoFetch(fetch)` and `loadRepo(loadFn)` - bind a repo to a load's `event.fetch` so API rules apply on SSR, hydration reuses the SSR response (one query), and parallel `+layout.ts`/`+page.ts` loads can't leak into each other. Removed `remultApiUniversalLoad` and `withRemultFetch` (the CSR path mutated the global `httpClient`); migrate to `loadRepo`. `remultApiServerLoad` is unchanged.
