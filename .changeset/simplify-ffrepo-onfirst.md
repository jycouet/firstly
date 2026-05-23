---
'firstly': patch
---

ffRepo (svelte): leaner surface. Rename `firstOnce` → `onFirst`; remove `draft`, `first`, `insert`, `update`, `deleteMany`. List handles (`load`/`listen`/`paginate`) are now read-only - write via `.repo` (+ `addItem`/`updateItem`/`removeItem` to reconcile). Editing lives on `one`/`create()` with argless `save()`/`delete()`.

New `DemoGrid` (from `firstly/svelte`): a generic inline-CRUD table over any entity - props `entity` + `fields`, headers/placeholders from each field's `caption`.
