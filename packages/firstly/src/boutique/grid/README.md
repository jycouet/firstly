# grid (boutique recipe) — App_Grid / App_Group

Copy-own `App_Grid` (CRUD grid) + `App_Group` (bound-record form) for firstly's cell layer, plus a
token-only default `Input`. They compose firstly's published primitives (`buildCells`, `<FF_Cell>`,
`<FF_CellValue>`, `<GroupFields>`, the `FF_Config.cell` registry) — and they're **yours to own**.

> Just want a grid with zero setup? Import the published `<FF_Grid>` from `firstly/svelte` (it bundles
> a default skin + input). Copy this boutique when you want to own the markup + look.

## Use

```bash
npx degit jycouet/firstly/packages/firstly/src/boutique/grid src/lib/app-grid
```

Register the input registry + dialog manager once at your app root:

```svelte
<script lang="ts">
	import { FF_Config, FF_DialogManager } from 'firstly/svelte'

	import Input from '$lib/app-grid/Input.svelte'
</script>

<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	<FF_DialogManager />
	{@render children()}
</FF_Config>
```

## `App_Grid`

Read + header-sort + paginate, with create / edit / delete in a dialog. Sits on `ff(E).many`. Config
is the SSoT on the entity (`hub`); every prop overrides it.

```svelte
<App_Grid entity={Task} />
<!-- all from Task.hub -->
<App_Grid entity={Task} cells={['title', 'done']} />
<!-- override columns -->
```

```ts
@FF_Entity<Task>('tasks', {
	hub: {
		cells: ['title', 'priority', { col: 'done', sortable: false }],
		insert: { cells: ['title', 'priority'] }, // `done` not settable on create
		// update omitted → inherits the list cells
		delete: {}, // {} on, false off
	},
})
```

- `cells` - columns + default form fields. `strategy` / `pageSize` / `where` / `orderBy` / `enabled`,
  `readonly`, `defaultSortable`, and per-action `insert` / `update` / `delete` (`{}` on, `false` off)
  all default to the hub. An action's `cells` omitted = inherit the list cells.
- `+ New` / per-row `Edit` are disabled from `meta.apiInsertAllowed()` / `apiUpdateAllowed(row)`.

Pair `insert.cells` with server enforcement on the field itself:

```ts
// settable on edit, never on insert (the API enforces it)
@Fields.boolean({ allowApiUpdate: (t) => !getEntityRef(t).isNew() }) done = false
```

## `App_Group`

A single bound record (`ff(E).one`) - a form when `mode="edit"`, values when `mode="readonly"`. Both
modes share the same height, so toggling doesn't shift the page. `disableDelete` shows Delete but
disabled.

```svelte
<App_Group entity={Task} cells={['title', 'priority']} mode="edit" />
```

`App_Grid`'s dialog and `App_Group` both render the published `GroupFields`, so a field looks identical
inline or in a dialog.

## Make it yours

Restyle `Input.svelte` (or add `select` / `date` / `multiSelect` variants), reskin the `data-ff-*`
hooks the shells emit, and bend `App_Grid` / `App_Group` to your app. Once copied, **it's your code**.
