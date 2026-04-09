---
'firstly': minor
---

Move `BaseEnum`, `FF_Entity`, `common` (`FF_Role`) source files from `lib/internals/` to `lib/core/`. The public export path is still `firstly/core`, which now also exports `FF_Role` (previously only available via `firstly/internals`) alongside the existing `BaseEnum`, `BaseEnumOptions`, `FF_Entity`, `isError`, `BaseItem`, `BaseItemLight`, `FF_Icon`. Consumers should migrate remaining `FF_Role` imports from `firstly/internals` to `firstly/core`.
