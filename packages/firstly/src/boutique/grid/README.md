# grid (boutique recipe)

Opinionated `FF_Grid` (CRUD grid) + `FF_Group` (bound-record form) for firstly's headless cell layer,
plus a token-only default `Input`. firstly ships the **primitives** (`buildCells`, `<FF_Cell>`, the
`FF_Config.cell` registry) - these shells are **yours to own**.

## Use

```bash
npx degit jycouet/firstly/packages/firstly/src/boutique/grid src/lib/ff-grid
```

Register the input registry once at your app root, so every cell of
`inputType: 'text' | 'number' | 'checkbox'` uses your `Input`:

```svelte
<script lang="ts">
	import { FF_Config } from 'firstly/svelte'

	import Input from '$lib/ff-grid/Input.svelte'
</script>

<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	{@render children()}
</FF_Config>
```

## `FF_Grid`

Read + header-sort + paginate, with create / edit / delete in a dialog. Sits on `ff(E).many`. Config
is the SSoT on the entity (`hub`); every prop overrides it.

```svelte
<FF_Grid entity={Task} />
<!-- all from Task.hub -->
<FF_Grid entity={Task} cells={['title', 'done']} />
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
  `readonly`, and per-action `insert` / `update` / `delete` (`{}` on, `false` off) all default to the
  hub. An action's `cells` omitted = inherit the list cells.
- `+ New` / per-row `Edit` are disabled from `meta.apiInsertAllowed()` / `apiUpdateAllowed(row)`.

Pair `insert.cells` with server enforcement on the field itself:

```ts
// settable on edit, never on insert (the API enforces it)
@Fields.boolean({ allowApiUpdate: (t) => !getEntityRef(t).isNew() }) done = false
```

## `FF_Group`

A single bound record (`ff(E).one`) - a form when `mode="edit"`, values when `mode="readonly"`. Both
modes share the same height, so toggling doesn't shift the page. `disableDelete` shows Delete but
disabled.

```svelte
<FF_Group entity={Task} selected={['title', 'priority']} mode="edit" />
```

`FF_Grid`'s dialog and `FF_Group` both render `GroupFields`, so a field looks identical inline or in a
dialog.

## Make it yours

Restyle `Input.svelte` (or add `select` / `date` / `multiSelect` variants), reskin the `data-ff-*`
hooks the shells emit, and bend `FF_Grid` / `FF_Group` to your app. Once copied, **it's your code**.
