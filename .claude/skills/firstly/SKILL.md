---
name: firstly
description: Firstly-specific patterns on top of Remult - FF_Entity (with built-in changelog), BaseEnum, ff (reactive Svelte layer: many/one), published modules (mail, cron, changeLog), and the Boutique copy-paste recipes (auth). Use when the user mentions firstly, FF_Entity, BaseEnum, ff/FF_Many/FF_One, firstly/mail, firstly/cron, or the boutique folder, or when building with `firstly` alongside Remult. Framework-agnostic but SvelteKit is the reference setup.
---

# Firstly Patterns

`firstly` is a thin, opinionated layer on top of [remult](https://remult.dev). It ships two kinds of things:

- **📦 Modules** - published inside the `firstly` package (`firstly/mail/server`, `firstly/cron/server`, ...). Import, register, forget.
- **🛍️ Boutique** - recipes under `packages/firstly/src/boutique/*` that you **copy into your own codebase** and own from then on.

> If you'd want to edit it, take the **boutique** version. If you just want it to work and upgrade cleanly, take the **module** version.

For generic Remult rules (repo, permissions, migrations, etc.), see the `remult` skill.

## Use `FF_Entity`, Not `@Entity`

In a firstly project, **always use `FF_Entity`**. It's a drop-in for `@Entity` with the same signature, plus changelog wired in. One more abstraction - just use it.

```ts
import { Fields } from 'remult'
import { FF_Entity } from 'firstly'

@FF_Entity<Task>('tasks', {
	allowApiCrud: true,
	saved: async (entity, event) => {
		if (event.isNew) {
			/* ... */
		}
	},
})
export class Task {
	@Fields.id() id!: string
	@Fields.string() title = ''
}
```

## `BaseEnum` - Richer Enums

Extends the `@ValueListFieldType` pattern with `caption`, `icon`, filter `where`, and a `hide` flag - useful when enums drive UI directly.

```ts
import { getValueList, ValueListFieldType } from 'remult'
import { BaseEnum } from 'firstly'

@ValueListFieldType()
export class TaskStatus extends BaseEnum {
	static Todo = new TaskStatus('todo', { caption: 'To do' })
	static Done = new TaskStatus('done', { caption: 'Done', hide: true })
}

for (const s of getValueList(TaskStatus)) {
	// s.id, s.caption, s.icon, s.hide...
}
```

`BaseEnum`'s constructor takes `(id, options)` - no need to redeclare fields on each subclass.

## Installing Firstly

```bash
npm add firstly@latest -D
```

No CLI, no scaffolder. Works in any Remult project.

## 📦 Modules (import)

Register like any Remult module.

```ts
import { remultApi } from 'remult/remult-sveltekit' // or remult-next, remult-express...

import { cron } from 'firstly/cron/server'
import { mail } from 'firstly/mail/server'

export const api = remultApi({
	modules: [
		mail(),
		cron([{ topic: 'nightly', cronTime: '0 3 * * *', onTick: () => ({ status: 'ok' }) }]),
	],
})
```

Available today: `mail`, `cron`, `changeLog`, `sqlAdmin`. See [firstly.fun](https://firstly.fun) for the full list.

### `sqlAdmin` - drop-in raw SQL page

A backend `BackendMethod` + a `<SqlAdmin />` Svelte component, both shipped from one module. Gated by `Roles_SqlAdmin.SqlAdmin_Admin` (or the global `FF_Role.FF_Role_Admin`).

```ts
// api.ts
import { sqlAdmin } from 'firstly/sqlAdmin/server'

export const api = remultApi({ modules: [sqlAdmin({ path: '/sql/admin' })] })
```

```svelte
<!-- routes/sql/admin/+page.svelte -->
<script>
	import { SqlAdmin } from 'firstly/sqlAdmin'
</script>

<SqlAdmin />
```

The component ships prefilled queries (DB size, table sizes, indexes, default `SELECT`) and logs results as `for AI: <rows>` in the browser console - so chrome-devtools / AI agents can grab them with `list_console_messages`.

## `FF_Allow` / `FF_Filter` - row-level helpers

Tiny helpers for the common "owner-only" / "admin or owner" patterns. `FF_Allow` is for `allowApi*` (per-row predicates), `FF_Filter` is for `apiPrefilter` / `backendPrefilter` (where-clauses). Both default the column name to `'userId'`.

**Pass the entity as a generic** (`FF_Allow.owner<Task>(...)`) for autocomplete and type-safety on the column name.

```ts
import { Fields } from 'remult'
import { FF_Allow, FF_Entity, FF_Filter } from 'firstly'

import { Roles } from '$lib/roles'

@FF_Entity<Task>('tasks', {
	// Owner-only writes:
	allowApiUpdate: FF_Allow.owner<Task>('userId'),
	allowApiDelete: FF_Allow.owner<Task>(), // defaults to 'userId'

	// Admin OR owner on writes:
	// allowApiUpdate: FF_Allow.ownerOr<Task>({ roles: [Roles.Admin] }),

	// Admin sees all, anyone else only their own:
	apiPrefilter: () => FF_Filter.ownerOr<Task>({ roles: [Roles.Admin] }),
})
export class Task {
	@Fields.id() id!: string
	@Fields.string() userId = ''
}
```

API:

- `FF_Allow.owner<T>(col?)` / `FF_Filter.owner<T>(col?)` - owner-only.
- `FF_Allow.ownerOr<T>({ col?, roles })` / `FF_Filter.ownerOr<T>({ col?, roles })` - admin (or any of `roles`) OR owner.

## `ff` - reactive layer (Svelte 5)

`ff` (from `firstly/svelte`) exposes a Remult entity as Svelte runes. **Two shapes**, both take a
**reactive options getter**; read reactive state (`items`/`draft`/`loading`/`error`/...) in markup.
Imperative work stays on remult's `repo(E)`. Full chapter:
[firstly.fun /docs/svelte/ff](https://firstly.fun/docs/svelte/ff).

```svelte
<script lang="ts">
	import { ff } from 'firstly/svelte'

	// many = a list + an editing draft + writes. strategy: 'listen' | 'load' | 'paginate'
	const tasks = ff(Task).many(() => ({ where: { done: false } }), 'listen')
	// one = a single bound record in `item`
	const editor = ff(Task).one(() => ({ where: { id }, enabled: !!id }))
</script>

{#each tasks.items as t (t.id)}{t.title}{/each}
```

Key rules:

- **Two shapes only.** `ff(E).many(getter, strategy?)` owns the list (`items`) **and** the editing
  `draft` plus the writes. `ff(E).one(getter)` is a single record bound to `item`. The fetch
  `strategy` is `'paginate'` (default: page + `$count` + `more()`), `'listen'` (liveQuery,
  auto-updates), or `'load'` (a static one-shot).
- **The getter is reactive** - change `where`/`orderBy`/`enabled`/`pageSize` and it re-fetches (stale
  responses dropped). `orderBy` defaults to the entity's `defaultOrderBy`. Read SvelteKit `load` data
  through a `$derived`, never raw in the getter. `enabled: false` skips the query until it flips true.
- **Editing (`many`)**: `edit(row)` loads a row into `draft` (**pass the row, not its id** - so it
  works with any PK incl. composite `id: ['a','b']`); `create(...)` starts a blank draft; argless
  `save()` / `remove()` act on the `draft`; `save(row)` / `remove(row)` target any row; `cancel()`
  drops the draft (and clears `error`). The list reconciles **automatically** (`load` = sorted upsert,
  `paginate` = refresh, `listen` = liveQuery). A failed write fills `error` and re-throws.
- **`edit` has two modes (why):** default `edit(row)` edits an isolated **clone** - instant (no fetch,
  no flicker), saving updates (the clone keeps remult's existing-row state), and `cancel()` leaves the
  list untouched. That's the "edit the row in front of me" case, so it's the default. `edit(row, {
  refetch: true })` re-reads fresh first (async, `draft` briefly `undefined` → guard `{#if draft}`) for
  when the list may be stale and you want the latest server values before editing.
- **Single record (`one`)**: bind a form to `item`; argless `save()` / `delete()` act on it;
  `create(...)` seeds a draft; `refresh()` re-fetches. `onFirst((latest) => ...)` (on **both** `many`
  and `one`) seeds editable `$state` once and never re-fires - why: a live source would otherwise
  re-run a `$derived`/`$effect` on every tick and clobber an in-progress edit. Read-only display →
  `$derived(handle.items[0])`; `onFirst` only when the seed must become editable.
- **Loading**: `loading` = `{ init, fetching, more, saving, deleting }`; `isBusy` / `isWriting` are
  derived rollups. Paginate-only: `hasNextPage`, `more()`, `aggregates.$count` (free, same request).
- **No `.repo` on the handle** - imperative reads/writes go through remult directly:
  `repo(E).insert/update/save/delete/deleteMany/findFirst/findId/count/...`. `.meta` **is** kept on
  every handle (labels/permissions): `r.meta.fields.<f>.caption`, `r.meta.apiInsertAllowed()` /
  `apiUpdateAllowed(item)` / `apiDeleteAllowed(item)` / `apiReadAllowed`. No `can*` helpers.
- **Reactive vs imperative**: `many`/`one` build an `$effect`, so create them at component init. For a
  click handler / async fn (no runes context) use remult's `repo(E)` (plain values, returns a Promise).
- **Make `items[0]` reliable**: "latest" follows your `orderBy` and the real SQL column type. Keep a
  datetime as `timestamptz` (a `@Fields.date()` stored as SQL `date` ties same-day rows and makes
  `date desc` non-deterministic; Remult won't ALTER an existing column, so verify at the DB).

`DemoGrid` (a full CRUD grid from one `many` handle) and `DemoForm` (a `one` bound form) ship from
`firstly/svelte` as ready demos / starting points.

Types: `FF_Many<T, Strategy>`, `FF_One<T>`, `FF_Builder<T>`, `FF_RepoOptions`, `ManyStrategy`.

## 🛍️ Boutique (copy-paste)

Grab a boutique recipe with [`degit`](https://github.com/Rich-Harris/degit):

```bash
npx degit jycouet/firstly/packages/firstly/src/boutique/auth src/modules/auth
```

Once copied, **it's your code**. Rewire imports (use your framework's env convention, e.g. `$env/static/private` in SvelteKit), adjust UI, plug in providers. Register its module the same way as an imported one:

```ts
import { auth } from '$lib/modules/auth/server/module'

export const api = remultApi({ modules: [auth({ SUPER_ADMIN_EMAILS })] })
```

Full instructions live in each boutique's README.

## Roles Convention

Each module exposes a `Roles_<ModuleName>` object and users merge them into one app-wide `Roles`.

```ts
// app/roles.ts
import { Roles_Cron } from 'firstly/cron'
import { Roles_Mail } from 'firstly/mail'
import { Roles_SqlAdmin } from 'firstly/sqlAdmin'

import { Roles_Auth } from '$lib/modules/auth/entities'

export const Roles = {
	Admin: 'admin',
	...Roles_Auth, // Auth.Admin
	...Roles_Mail, // Mail.Admin
	...Roles_Cron, // Cron.Admin
	...Roles_SqlAdmin, // SqlAdmin.Admin
} as const
```

Use `Roles.*` in `allowApi*` decorators and assign them to users via the auth boutique's `addRolesToUser` helper or `SUPER_ADMIN_EMAILS`.

## Naming - `FF_` Prefix

Types and helpers exported by firstly that could collide with user code use the `FF_` prefix: `FF_Entity`, `FF_Role`, `FF_Allow`, `FF_Filter`, `FF_Icon`, `FF_LogToConsole`, `FF_Many` / `FF_One` (reactive handle types). If you see it in an import path, it's firstly's. Factory functions stay camelCase (e.g. `ff`).
