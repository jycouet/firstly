# Cell layer - metadata-driven grids & forms (Svelte 5)

Grids and forms are built from **field metadata** declared once on the entity and rendered anywhere
(see [firstly.fun /docs/svelte/cell](https://firstly.fun/docs/svelte/cell)). Two halves:

- **📦 Published** (`firstly/svelte`): `buildCells(meta, cells?)`, `displayCell`, `<FF_Cell>`,
  `<FF_CellValue>` (renders a cell's value incl. the component escape), `<GroupFields>` (shared form
  body), `DefaultInput`, the `FF_Config.cell` registry, the `hub` entity config + types. **Plus
  `<FF_Grid>`** — the batteries-included demo grid (default skin + bundled input, zero setup:
  `import { FF_Grid } from 'firstly/svelte'`; just mount `<FF_DialogManager>` once).
- **🛍️ Boutique** (`src/boutique/grid`, copy-own — degit when you want to own the look): `App_Grid`
  (CRUD grid), `App_Group` (bound record), `Input`. (`FF_` = firstly's, `App_` = yours - full rule in
  the SKILL.md Naming section.)

Key rules:

- **Metadata is SSoT.** Per-field UI hints live on the field via `ui` (a firstly augmentation of
  remult `FieldOptions`): `width`/`marginLeft`/`marginRight` are **% of the row**, plus `align`,
  `inputType` (override the editor), `order`, and `mobile: {…}` (screens `<= 40rem`). Also
  `placeholder` and `href: (row)=>string` (renders a `field_link`). Escape hatches on a `CellInput`
  config: `cellSnippet`, `component` (a lazy `() => Comp` / `() => import('./x.svelte')` thunk) +
  `props` + `rowToProps`, `sortable` (columns sort by default; per-cell wins), `class`.
- **Sortable default** is `true`; flip it with `defaultSortable: false` on the `hub` (per-entity) or
  `FF_Config.cell` (app-wide). Per-cell `sortable` always wins.
- **Entity hub = SSoT config.** Declare the grid/form config on the entity via the `hub` option
  (`@FF_Entity<E>('x', { hub: { cells, defaultSortable?, where, orderBy, strategy, pageSize, insert, update, delete } })`).
  `FF_Grid`/`FF_Group` read it as defaults; every prop overrides. A `hub` whose `cells` reference field
  keys NEEDS the explicit generic (`@FF_Entity<E>`), else `@Entity` type inference breaks. Keep `hub` a
  plain object (server-safe) - `component`s must be lazy thunks. `insert`/`update`/`delete` are
  per-action `ActionConfig` (`{}` on, `false` off); an action's `cells` omitted = inherit the list cells.
- **Input registry.** Register which component renders each `inputType` once at app root:
  `<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>`. firstly ships
  **no** styled input - the `grid` boutique gives a token-only `Input` to copy.
- **Read config at init.** Components call `ffConfig()` / `getCellElementConfig()` **at component
  init only** (Svelte 5 context) - never in a `$derived` or markup. The dialog is portaled to the app
  root (outside the page `<FF_Config>`), so `FF_Grid` captures `const cfg = ffConfig()` and
  re-provides `<FF_Config cell={cfg.cell}>` inside the dialog.
- **The grid** (`FF_Grid` published / `App_Grid` boutique — same code) sits on `ff(E).many` (all three
  strategies). `cells` = columns (default `hub.cells`); the create/edit forms use
  `insert.cells`/`update.cells` (default: inherit `cells`). `+ New` / `Edit` disable from
  `meta.apiInsertAllowed()` / `apiUpdateAllowed(row)`. Cell values render via `FF_CellValue`.
- **UI naming ≠ security.** Dropping a field from `insert.cells` is UX only. Enforce on the field:
  `@Fields.boolean({ allowApiUpdate: (t) => !getEntityRef(t).isNew() })` makes it settable on edit but
  not insert (the API rejects it). The two are complementary - lock on the field, mirror in the UI.
- **`App_Group`** (boutique) is one bound record (`ff(E).one`): a form when `mode="edit"`, values when
  `mode="readonly"`; both modes share a height so toggling doesn't shift the page. The grid's dialog
  and `App_Group` both render the published `GroupFields`, so a field looks identical inline or in a dialog.
