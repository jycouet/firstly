---
name: firstly
description: Firstly-specific patterns on top of Remult - FF_Entity (with built-in changelog), BaseEnum, ffRepo (reactive Svelte repo wrapper), published modules (mail, cron, changeLog), and the Boutique copy-paste recipes (auth). Use when the user mentions firstly, FF_Entity, BaseEnum, ffRepo/FF_Repo, firstly/mail, firstly/cron, or the boutique folder, or when building with `firstly` alongside Remult. Framework-agnostic but SvelteKit is the reference setup.
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

## `ffRepo` - reactive Remult repo (Svelte 5)

`ffRepo` (from `firstly/svelte`) wraps a Remult `repo` as Svelte runes. Pick a mode with a verb and
hand it a **reactive options getter**; read reactive state (`items`/`loading`/`error`/...) in markup.
Full chapter: [firstly.fun /docs/svelte/ff-repo](https://firstly.fun/docs/svelte/ff-repo).

```svelte
<script lang="ts">
	import { ffRepo } from 'firstly/svelte'

	const tasks = ffRepo(Task).load(() => ({ where: { done: false } })) // load (one-shot list)
	// .listen(getter)   - liveQuery, auto-updates
	// .paginate(getter) - more() / hasNextPage / aggregates.$count (pairs with `infiniteScroll`)
	// .one(getter)      - a single reactive record in `item` (bind a form to it)
</script>

{#each tasks.items as t (t.id)}{t.title}{/each}
```

Key rules:

- **One rule for the surface**: anything **not** under `.repo` is reactive (a verb returns a runes
  handle whose writes sync its own state); anything under **`.repo`** is the plain remult repo -
  imperative, returns Promises, touches no runes state.
- **The getter is reactive** - change `where`/`orderBy`/`enabled` and it re-fetches (stale responses
  dropped). `orderBy` defaults to the entity's `defaultOrderBy`. Read SvelteKit `load` data through a
  `$derived`, never raw in the getter (raw re-fetches on every revalidation).
- **`enabled: false`** skips the query (keeps the last result) until it flips true.
- **Mutations**: only the **record handle** (`one`/`create()`) writes - argless `save()`/`delete()`
  act on its `item` (re-sync + re-throw, filling `error`). **List handles** (`load`/`listen`/`paginate`)
  are read-only; write through `.repo` (`ffRepo(E).repo.insert`/`update`/`save`/`delete`/`deleteMany`),
  then on `load`/`paginate` reconcile with `addItem`/`updateItem`/`removeItem` (a `listen` list self-syncs).
- **Client-side list reconcilers** (`load`/`paginate`): `addItem(item, { at? })` / `updateItem(item)` /
  `removeItem(idOrItem)` reflect a change you made elsewhere in `items` with no server I/O. `add`/`remove`
  adjust `aggregates.$count`; for authoritative state call `refresh()`. (`listen` self-reconciles.)
- **Latest row & seeding**: the newest row (with `orderBy: { ...: 'desc' }`) is `items[0]`; for
  read-only display use `$derived(r.items[0])`. To seed editable `$state` from it once, call
  `onFirst((latest) => ...)` - it fires a single time when the first row lands, so the input then
  owns the value and a later live tick won't overwrite an in-progress edit.
- **Labels come from remult metadata** - don't hardcode them: `r.meta.fields.<f>.caption` for a
  field label/placeholder, `r.meta.caption` for the entity. `r.meta` is the entity's remult metadata
  (also `apiInsertAllowed()` / `fields` / `idMetadata`); `r.repo` is the full remult repo. ffRepo
  only adds Svelte reactivity - reach through `.meta` / `.repo` for everything else remult already does.
- **Make `items[0]` reliable**: "latest" follows your `orderBy` and the real SQL column type. Keep a
  datetime as `timestamptz` (a `@Fields.date()` stored as SQL `date` ties same-day rows and makes
  `date desc` non-deterministic; Remult won't ALTER an existing column, so verify at the DB). Drive
  the grid, the edited row, and the latest from one live source.
- **Permissions: no `can*` helpers** - use `r.meta.apiInsertAllowed()` / `apiUpdateAllowed(item)` /
  `apiDeleteAllowed(item)` / `apiReadAllowed`. `r.repo` / `r.meta` are the escape hatches.
- **Reactive vs imperative**: reactive verbs build an `$effect`, so create them at component init.
  For a click handler / async fn (no runes context) go through `.repo` (plain remult, takes plain
  values, returns a Promise): `ffRepo(E).repo.findFirst(where)`, `.repo.findId(id)`, `.repo.insert(...)`.
- **Counts**: only `paginate` exposes `aggregates.$count` (free, same request). For a one-off count
  use `ffRepo(E).repo.count(where)`.

Types: umbrella `FF_Repo<T>` (any handle), per-mode `FF_RepoLoad`/`FF_RepoLive`/`FF_RepoPaginate`/
`FF_RepoOne`, plus `FF_RepoBuilder`/`FF_RepoOptions`.

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

Types and helpers exported by firstly that could collide with user code use the `FF_` prefix: `FF_Entity`, `FF_Role`, `FF_Allow`, `FF_Filter`, `FF_Icon`, `FF_LogToConsole`, `FF_Repo*` (handle/option types). If you see it in an import path, it's firstly's. Factory functions stay camelCase (e.g. `ffRepo`).
