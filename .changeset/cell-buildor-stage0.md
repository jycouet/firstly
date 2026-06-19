---
'firstly': minor
---

Add the cell layer: metadata-driven grids/forms over remult.

- **Published** (`firstly/svelte`): `buildCells` / `displayCell` / `<FF_Cell>` / `<FF_CellValue>` / `<GroupFields>` + the `FF_Config.cell` registry, with `%` widths, configurable per-column `sortable` (`defaultSortable`), and a `component`/`props` escape (lazy `CellComponent` thunks). Config is the SSoT on the entity via a new `hub` option on `EntityOptions`. **Plus `<FF_Grid>`** - a batteries-included demo grid (default skin + input, zero setup).
- **Boutique** (`src/boutique/grid`, copy-own): `App_Grid` / `App_Group` shells you degit to own the look.
- `DemoGrid` / `DemoForm` removed.
