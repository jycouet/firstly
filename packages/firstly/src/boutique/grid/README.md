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

Read + header-sort + paginate, with create / edit / delete in a dialog. Sits on `ff(E).many`, so it
gets the three fetch strategies.

```svelte
<FF_Grid
	entity={Task}
	selected={['title', 'priority', 'done']}
	createFields={['title', 'priority']}
	strategy="paginate"
/>
```

- `selected` - table columns (and default form fields).
- `createFields` / `editFields` - name the form fields per context (default: `selected`). Above,
  `done` shows in the grid + edit, but not in create.
- `strategy` (`paginate` | `listen` | `load`), `pageSize`, `where`, `orderBy`, `enabled` (lazy gate),
  `readonly` (hide the dialog).
- `+ New` / per-row `Edit` are disabled from `meta.apiInsertAllowed()` / `apiUpdateAllowed(row)`.

Pair `createFields` with server enforcement on the field itself:

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
