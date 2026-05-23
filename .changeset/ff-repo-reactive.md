---
'firstly': minor
---

**BREAKING (svelte): `FF_Repo` class -> `ffRepo()` factory.** The reactive repo wrapper now takes a reactive options getter and a mode (`find` / `listen` / `paginate` / `one`), with built-in mutations, `firstOnce`/`draft`, and permissions via `r.meta`. The old `new FF_Repo(E, { findOptions })` class is removed.

Also new: `infiniteScroll` (svelte attachment, pairs with `paginate`), `stackHttpClient`/`withHeader` (core), `FF_Filter.containsWords` (multi-field search filter), `splitTrim` (formats), and exported `QueryOptionsHelper`/`AggregateOptions`/`FF_Repo*` types.

Migration (see `/docs/svelte/ff-repo`):

- `new FF_Repo(E, { findOptions: { where } })` -> `ffRepo(E).find(() => ({ where }))`
- `new FF_Repo(E, { queryOptions })` + `.query()/.queryMore()/.queryRefresh()` -> `ffRepo(E).paginate(() => ({ ... }))` + `.more()/.refresh()`
- `r.globalError` -> `r.error`
- `r.fields` -> `r.meta.fields`; `r.metadata.apiInsertAllowed()` -> `r.meta.apiInsertAllowed()`
- `repo(r.ent).update(...)` / `.insert(...)` -> `r.update(...)` / `r.insert(...)`
- `r.aggregates.$count` unchanged; `skipAutoFetch` -> `enabled: false`
