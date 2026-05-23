---
'firstly': minor
---

**BREAKING (svelte): `FF_Repo` class -> `ffRepo()` factory.** The reactive repo wrapper now takes a reactive options getter and a mode (`load` / `listen` / `paginate` / `one`), with built-in mutations, `firstOnce`/`draft`, and permissions via `r.meta`. The old `new FF_Repo(E, { findOptions })` class is removed.

One rule: anything not under `.repo` is reactive; every imperative read/write lives on `.repo` (the plain remult repo). The builder no longer hoists `findFirst`/`findId`/`insert`/... - use `ffRepo(E).repo.*`.

Also new: `infiniteScroll` (svelte attachment, pairs with `paginate`), `stackHttpClient`/`withHeader` (core), `FF_Filter.containsWords` (multi-field search filter), `splitTrim` (formats), and exported types including the umbrella `FF_Repo` handle plus `FF_RepoBuilder`/`FF_RepoLoad`/`FF_RepoLive`/`FF_RepoPaginate`/`FF_RepoOne`/`QueryOptionsHelper`/`AggregateOptions`.

Migration (see `/docs/svelte/ff-repo`):

- `new FF_Repo(E, { findOptions: { where } })` -> `ffRepo(E).load(() => ({ where }))`
- `new FF_Repo(E, { queryOptions })` + `.query()/.queryMore()/.queryRefresh()` -> `ffRepo(E).paginate(() => ({ ... }))` + `.more()/.refresh()`
- `r.globalError` -> `r.error`
- `r.fields` -> `r.meta.fields`; `r.metadata.apiInsertAllowed()` -> `r.meta.apiInsertAllowed()`
- `repo(r.ent).update(...)` / `.insert(...)` -> `r.update(...)` / `r.insert(...)`
- `r.aggregates.$count` unchanged; `skipAutoFetch` -> `enabled: false`
