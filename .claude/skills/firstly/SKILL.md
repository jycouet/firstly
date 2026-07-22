---
name: firstly
description: 'firstly - a thin opinionated layer on top of Remult (framework-agnostic, SvelteKit reference). Use when the user mentions firstly, FF_Entity, BaseEnum, the reactive ff layer (ff/FF_Many/FF_One), the cell layer (buildCells/FF_Cell/FF_Grid/GroupFields), firstly modules (mail, cron, changeLog, sqlAdmin), or the boutique copy-paste recipes (auth, grid) - or when building with firstly alongside Remult.'
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

### `cron` - logs & failures

A tick logs one `done in Xms` line only when it took at least `logs.ended` ms (default 100; `true` = always, `false` = never); `starting`/`result` are opt-in, failures and concurrency skips always log. Full run history (results, errors, skips) lives in the `_ff_crons` entity ("FF Crons" in Admin UI, gated by `Roles_Cron.Cron_Admin`). A throwing `onTick` is stored as `failed` and never stops the schedule.

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
- **Action+confirm orchestration (`many`)** - the confirm/show/cancel dance, on the handle:
  `confirmRemove(row, { message?, danger?, toast?, ... })` (confirm → `remove(row)` → auto
  `toast.fromError` on failure; resolves `{ ok }`, **never re-throws** - safe for
  `onclick={() => list.confirmRemove(row)}`), and `editInDialog(row, body, { refetch? })` /
  `createInDialog(body, { defaults? })` (seed `draft` → `dialog.show(body)` → always `cancel()` on
  close). The `body` snippet binds `draft` and calls `save()` itself (so a failed/validation save
  keeps the dialog open via `error`); these just own the seed + cleanup.
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

Types: `FF_Many<T, Strategy>`, `FF_One<T>`, `FF_Builder<T>`, `FF_RepoOptions`, `ManyStrategy`.

## `remultApiUniversalLoad` / `remultApiServerLoad` - reading in loads with API rules

`ff` is component-level (browser-only). To read in a SvelteKit **`load`** with the entity's API
rules applied (`allowApiRead` / `apiPrefilter`, as the current user), wrap the load. Server code is
privileged by default - a bare `repo()` on the server bypasses the API gate - so these wrappers route
the read through the API instead.

```ts
// +page.ts (universal) - gated on SSR AND CSR, plain global repo()
import { remultApiUniversalLoad } from 'firstly/svelte'
// +page.server.ts - gate a SERVER read (instead of the privileged in-process DB)
import { remultApiServerLoad } from 'firstly/svelte/server'

export const load = remultApiUniversalLoad(async ({ params }) => ({
	tasks: await repo(Task).find({ where: { done: false } }),
}))

export const load = remultApiServerLoad(async () => ({ tasks: await repo(Task).find() }))
```

Both run the body in a scoped `withRemult` bound to `event.fetch`, so plain global `repo()` /
`ff()` is gated and a concurrent load keeps its own provider. On the server, SvelteKit dispatches
same-origin `event.fetch` in-process (no network) with cookies forwarded, so the app's real
auth/hooks run per read.

- **`remultApiUniversalLoad`** (`firstly/svelte`): a universal load runs on the client too; on
  CSR/hydration it reuses the inlined SSR response.
- **`remultApiServerLoad`** (`firstly/svelte/server`, server-only): use it only when a server load
  should see exactly what the API exposes; otherwise a server load keeps the privileged DB (gate
  rows with `backendPrefilter`). BackendMethods keep their own `allowed` gate.
- Both carry `remult.user` into the scope and pass `event` through untouched.

## Cell layer - metadata-driven grids & forms (Svelte 5)

Grids and forms are built from **field metadata** declared once on the entity and rendered anywhere -
published `<FF_Grid>` / `buildCells` / `<GroupFields>` plus the copy-own `grid` boutique
(`App_Grid` / `App_Group`). When building a grid, form, or any `FF_Cell` / `FF_CellValue` /
`hub` / `ui`-driven UI, read [`cell.md`](cell.md) for the full layer.

## `dialog` - headless dialogs (Svelte 5)

`dialog` (from `firstly/svelte`) is an async dialog layer. **Every `dialog.*` call resolves the same
`DialogResult` (`{ ok: true, data } | { ok: false }`) - ALWAYS read `.ok` (or destructure `{ ok }`);
never use the result as a boolean, the object is always truthy so `if (await dialog.confirm(...))`
silently always passes.** `dialog.show(body, opts)` (`body` = snippet receiving `close(result?)`) and
`dialog.open(component, { props })` resolve `{ ok, data }`; `dialog.confirm(message, { title?,
danger?, confirmLabel?, cancelLabel? })` resolves `{ ok }` (no `data`); `dialog.prompt({...})`
resolves `{ ok, data: string }`.
Mount `<FF_DialogManager />` once at the app root: it's **headless** (owns esc / scroll-lock /
stacking) and renders built-in **default** shell + confirm styled in semantic Tailwind tokens
(`bg-card`, `border-border`, `bg-primary`, `bg-destructive`, ...) so they inherit the app theme with
zero config. Pass `shell` / `confirm` snippets to fully restyle. Confirm labels are `LocalizedMessage`.

## `toast` - notifications (Svelte 5)

`toast` (from `firstly/svelte`) is a thin wrapper over [svelte-sonner](https://svelte-sonner.vercel.app)
(a direct firstly dependency - consumers install nothing). Mount `<FF_ToastManager />` once (it renders
sonner's `<Toaster>`; sonner props via `<FF_Config toast={{ position, richColors, ... }}>`).

**The first arg is the `description`** (the body) and **may contain HTML**. A bold **title** sits above
it; it **defaults per kind** (`error` → "Error", …) and is overridable via `opts.title`:

```ts
toast.error('Could not save the quote') // title "Error" + body
toast.success('Saved <b>3</b> rows', { title: '🎉 Done' })
toast.fromError(err) // error toast from any thrown value
```

`toast.success / error / info / warning (description, { title?, duration?, action? })`,
`toast.show(description, { kind? })`, `toast.fromError(err)`, `toast.dismiss(id?)`. Labels are
`LocalizedMessage` (string or message fn), resolved at call time. **Per-kind default titles are
localizable** via `<FF_Config messages={{ toast: { error, success, info, warning } }}>` (pass message
functions for i18n). `many.confirmRemove` uses `toast.fromError` on a failed delete.

**Security:** the description renders as **HTML** - pass only trusted/sanitized content, never raw
user or network/error text (XSS). `toast.fromError` HTML-escapes its extracted message, so error text
is always safe to show; titles are always plain text.

## `stackHandleClientError` - stack `hooks.client.js` error handlers

`stackHandleClientError` (from `firstly/svelte`) composes `handleError` middlewares, mirroring
`stackHttpClient`. Middlewares run outermost-first; each either short-circuits (return without
calling `next`) or calls `next(input)`. The base returns `{ message: 'Something went wrong' }`.

`withStaleDeployReload()` is the built-in middleware: after a deploy an open client (esp. SPA builds)
404s on a lazy chunk; SvelteKit's `updated.check()` recovery lies behind a CDN caching `version.json`.
It trusts the failure signal instead - on a chunk-load error it hard-reloads once (time-boxed
one-shot guard, no reload loop), passing every other error to `next`.

```js
// src/hooks.client.js
import { stackHandleClientError, withStaleDeployReload } from 'firstly/svelte'

export const handleError = stackHandleClientError(withStaleDeployReload(), (next) => (input) => {
	report(input.error) // your logging
	return next(input) // or return { message: 'Oops' } to stop here
})
```

Only chunk-load errors reload (a blind 404 reload would break client-side not-found routes).

## Prod server (adapter-node) - compression without breaking SSE

adapter-node ships **no compression** - a data-heavy page can send 100KB+ of uncompressed HTML.
Wrap the built handler with `@polka/compression` (streaming-safe; gzip by default, `brotli: true`
to enable), and **bypass remult's SSE endpoint** (`<apiPrefix>/stream`, default `/api/stream`) - a
compressed/buffered event stream stalls liveQuery, so `'listen'` never updates.

```js
// scripts/prod-server.js - `node scripts/prod-server.js` (also the Docker CMD)
import compression from '@polka/compression'
import polka from 'polka'

import { handler } from '../build/handler.js'

const compress = compression({ threshold: 1024 })

polka()
	.use((req, res, next) => {
		if (req.url.startsWith('/api/stream')) return next() // SSE: never compress
		compress(req, res, next)
	})
	.use(handler)
	.listen(Number(process.env.PORT ?? 3000))
```

`polka` + `@polka/compression` are runtime deps (not devDeps) - the script imports them in the
production image.

## i18n - `LocalizedMessage`

firstly's localizable-string convention (from `createValidators`, reused by `dialog.confirm`):

```ts
type LocalizedMessage = string | (() => string)
```

A literal for single-locale apps, or a **function** resolved at render / validation time - typically a
paraglide / i18next / lingui message function, so it tracks the current locale. firstly resolves it
with `resolveMessage(m)` (`typeof m === 'function' ? m() : m`). Pass the message _function_ (not a
pre-resolved string) so locale switches stay reactive:

```ts
import * as m from '$lib/paraglide/messages'

dialog.confirm(m.delete_confirm, { confirmLabel: m.delete, danger: true })
```

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

## Naming - `FF_` (firstly's) vs `App_` (yours)

The prefix tells you who owns the code:

- **`FF_` = firstly publishes it** - imported from the package, upgrades with it. Used for exports
  that could collide with user code: `FF_Entity`, `FF_Role`, `FF_Allow`, `FF_Filter`, `FF_Icon`,
  `FF_LogToConsole`, `FF_Many` / `FF_One` (reactive handle types), `FF_Grid` / `FF_CellValue`. If you
  see it in an import path, it's firstly's. Factory functions stay camelCase (e.g. `ff`).
- **`App_` = your app's** - the copy-own **boutique** version you degit into your codebase and own from
  then on (e.g. `App_Grid` / `App_Group`, copied from `FF_Grid` / `GroupFields`). Often a boutique
  recipe is the same code as its `FF_` counterpart, just yours to restyle.
