---
'firstly': minor
---

Add the headless cell layer: `buildCells`, `displayCell`, `<FF_Cell>` / `<FF_CellValue>`, and the `FF_Config.cell` input registry - metadata-driven grids/forms with `%` widths, per-column `sortable`, and a `component`/`props` escape (lazy `CellComponent` thunks). Config is the SSoT on the entity via a new `hub` option on `EntityOptions` (read as defaults, overridable per call). The opinionated `FF_Grid` / `FF_Group` shells ship as a copy-own `grid` boutique recipe (`src/boutique/grid`), not published; `DemoGrid` / `DemoForm` are removed.
