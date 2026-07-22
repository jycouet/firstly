# firstly

## 0.7.3

### Patch Changes

- [#315](https://github.com/jycouet/firstly/pull/315) [`3403d6c`](https://github.com/jycouet/firstly/commit/3403d6cffa657ad04acdac26024bdf6e989df7b4) Thanks [@jycouet](https://github.com/jycouet)! - cron: quieter logs by default - a tick only logs `done in Xms` when it took at least `logs.ended` ms (default 100; `true` = always, `false` = never). `starting` and `result` lines are opt-in, `logs.setup` can silence the registration line. If `onTick` throws, the run is now stored as `failed` (error in `result`), always logged, and no longer leaks the concurrency slot.

## 0.7.2

### Patch Changes

- [#313](https://github.com/jycouet/firstly/pull/313) [`501d922`](https://github.com/jycouet/firstly/commit/501d92220ec32a19622eed403c85f445c3ccc68e) Thanks [@jycouet](https://github.com/jycouet)! - `remultApiServerLoad` reads through `event.fetch` instead of `TestApiDataProvider`: concurrency-safe on released remult (no process-global static swap), and the API side runs the app's real auth/hooks.

## 0.7.1

### Patch Changes

- [#309](https://github.com/jycouet/firstly/pull/309) [`a47b6a7`](https://github.com/jycouet/firstly/commit/a47b6a75285a0643342b35107963c3f56dbd71ca) Thanks [@jycouet](https://github.com/jycouet)! - Add `remultApiUniversalLoad` (`firstly/svelte`) and `remultApiServerLoad` (`firstly/svelte/server`): wrap a SvelteKit load so plain `repo()` reads apply the entity's API rules (`allowApiRead` / `apiPrefilter`) as the current user. The universal one binds to `event.fetch` (SSR + CSR); the server one dispatches in-process via `TestApiDataProvider`.

## 0.7.0

### Minor Changes

- [#293](https://github.com/jycouet/firstly/pull/293) [`b70928c`](https://github.com/jycouet/firstly/commit/b70928c23ef5e6392abfdd9c57df03e009855abe) Thanks [@jycouet](https://github.com/jycouet)! - Add the cell layer: metadata-driven grids/forms over remult.
  - **Published** (`firstly/svelte`): `buildCells` / `displayCell` / `<FF_Cell>` / `<FF_CellValue>` / `<GroupFields>` + the `FF_Config.cell` registry, with `%` widths, configurable per-column `sortable` (`defaultSortable`), and a `component`/`props` escape (lazy `CellComponent` thunks). Config is the SSoT on the entity via a new `hub` option on `EntityOptions`. **Plus `<FF_Grid>`** - a batteries-included demo grid (default skin + input, zero setup).
  - **Boutique** (`src/boutique/grid`, copy-own): `App_Grid` / `App_Group` shells you degit to own the look.
  - `DemoGrid` / `DemoForm` removed.

## 0.6.3

### Patch Changes

- [#298](https://github.com/jycouet/firstly/pull/298) [`626db86`](https://github.com/jycouet/firstly/commit/626db8664ddcd480bc941ba38c51aaee742188c3) Thanks [@jycouet](https://github.com/jycouet)! - fix(deps): declare `@kitql/helpers` as a runtime dependency

  `esm/index.js` does `import * as h from '@kitql/helpers'` (and re-exports it /
  builds `ff_Log` from it), but the package only listed it under
  `devDependencies`. Consumers that didn't happen to hoist it got
  `Cannot find module '@kitql/helpers'` at runtime. Moved it into `dependencies`.

## 0.6.2

### Patch Changes

- [#296](https://github.com/jycouet/firstly/pull/296) [`ae7d8ec`](https://github.com/jycouet/firstly/commit/ae7d8ec532e677d42e1e5730c1ef58a29bb32062) Thanks [@jycouet](https://github.com/jycouet)! - fix(svelte): portal `FF_DialogManager` panels to `<body>`

  Dialog/confirm/prompt panels rendered wherever `<FF_DialogManager>` sat in the
  layout - inside the app root that the manager marks `inert` to trap focus. When
  the `inert` effect won the race against the panel's autofocus, the whole panel
  stopped receiving pointer events (real clicks died; `elementFromPoint` returned
  `<body>`; AT saw it as "ignored"), while synthetic `.click()` still worked - so
  it looked fine in tests but was dead under a real mouse.

  Panels are now portaled to `<body>` (true siblings of the app root, matching the
  existing design comment), so inerting the root never touches them. The
  now-obsolete `root.contains(activeElement)` race-guard is dropped, so the
  background is reliably inerted again.

## 0.6.1

### Patch Changes

- [#294](https://github.com/jycouet/firstly/pull/294) [`7e8c2af`](https://github.com/jycouet/firstly/commit/7e8c2afa7806cf3383d64b048e8f3b9b5b19d237) Thanks [@jycouet](https://github.com/jycouet)! - ff: add `onNew` and `onIssue` lifecycle hooks to the reactive handle (and make `onFirst` chainable)
  - **`onItem(record => …)`** (`one` mode) / **`onItems(items => …)`** (list modes) - run after each fetch with the loaded data, mirroring the handle's `.item` / `.items` (replaces the old `storeList`/`storeItem` `onNewData`). `onItem` fires only when a row is found - a not-found goes to `onIssue`. `onFirst` stays the once-only seed.
  - **`onIssue(issue => …)`** - runs when a read doesn't yield the expected data. `issue` is `{ kind: 'notFound' | 'forbidden' | 'error', status?, message? }`; switch on `kind` to react (e.g. redirect). A `one` query that resolves with no row reports `{ kind: 'notFound', status: 404 }`; a rejected read reports `forbidden` (403) or `error`.
  - All three hooks are now chainable: `ff(E).one(getter).onIssue(…).onNew(…).onFirst(…)`.
  - **`ff(E).one()` accepts `{ id }` or `{ where }`** (mutually exclusive - a type error if both). `{ id }` loads by primary key via `findId` (no `_sort`/`_limit` on a unique lookup, and dedups with other findId callers); `{ where }` loads via `findFirst` (with optional `orderBy`). `{ id }` re-runs reactively when the id changes.

## 0.6.0

### Minor Changes

- [#286](https://github.com/jycouet/firstly/pull/286) [`0de3038`](https://github.com/jycouet/firstly/commit/0de3038769bd30f7449f3185d9556bb5966eea6f) Thanks [@jycouet](https://github.com/jycouet)! - Add `<FF_Config>` (`firstly/svelte`): an SSR-safe, context-scoped provider for app-wide UI config, read by firstly components during init. First consumer is the dialog: set default `confirm` / `cancel` / `ok` labels once and your `shell` / `confirm` / `prompt` snippets in one place, instead of passing them on every `dialog.confirm(...)` / `<FF_DialogManager>`.

  Precedence is explicit prop > `<FF_Config>` > built-in. Pass message **functions** (paraglide / i18next) for labels and they re-resolve on every render, so locale changes are picked up for free. `dialog.confirm` / `dialog.prompt` no longer bake `'Confirm'` / `'Cancel'` / `'OK'` at call time - omitted labels resolve at render via the nearest `<FF_Config>` (then the built-in). Also exports `ffConfig()` (read) and `setFFConfig()` (advanced).

- [#286](https://github.com/jycouet/firstly/pull/286) [`d364fe2`](https://github.com/jycouet/firstly/commit/d364fe22211a2d7a7acbb58afc367bae1a7e911d) Thanks [@jycouet](https://github.com/jycouet)! - Add a headless async `dialog` layer (`firstly/svelte`): `dialog.show(body)`, `dialog.confirm(message)`, `dialog.prompt(opts)`, rendered through a single `<FF_DialogManager>` you mount once. Built-in defaults are theme-adaptive via semantic Tailwind tokens; pass `shell` / `confirm` / `prompt` snippets to fully restyle. Ships `ffAutofocus`, Escape/scroll-lock/stacking, and a `LocalizedMessage` (string or fn) for labels. `dialog.open(Component, { props })` opens a dialog from a component + props, inferring the result type from the component's `close: DialogClose<T>` prop (no call-site generic).

  One result contract for all three: they resolve a `DialogResult` (`{ ok: true, data } | { ok: false }`). `confirm` carries no `data` (read `.ok`); `prompt`'s `data` is the trimmed string (so cancel vs empty-string is unambiguous - `{ ok: false }` vs `{ ok: true, data: '' }`); `show<T>` carries `T`. See `/docs/svelte/dialog`.

- [#286](https://github.com/jycouet/firstly/pull/286) [`fcafe26`](https://github.com/jycouet/firstly/commit/fcafe26833a018aea9e5fe2313120173a112eb80) Thanks [@jycouet](https://github.com/jycouet)! - Replace `ffRepo` with a cleaner `ff` surface: `ff(E).many(getter, strategy?)` (a list + editing draft + writes) and `ff(E).one(getter)` (a single bound record). `load`/`listen`/`paginate` are now the `strategy`, not separate verbs. Imperative work moves to remult's `repo(E)` (no `.repo` on the handle); `.meta` stays. Adds an exported `DemoForm` alongside `DemoGrid`.

### Patch Changes

- [#288](https://github.com/jycouet/firstly/pull/288) [`7133d3c`](https://github.com/jycouet/firstly/commit/7133d3c31c276f2932a8c7efeaca3cd5e05a51b5) Thanks [@jycouet](https://github.com/jycouet)! - Add `many` action+confirm orchestration and a `toast` (`firstly/svelte`):
  - `ff(E).many().confirmRemove(row, opts?)` (confirm → remove → auto error-toast, never re-throws), `editInDialog(row, body, opts?)` and `createInDialog(body, opts?)` (seed draft → `dialog.show` → cancel on close).
  - `toast` + `<FF_ToastManager>` - a `LocalizedMessage`-aware wrapper over svelte-sonner (a new direct dependency). First arg is the **description** (HTML allowed); the bold **title** moves to `opts.title` and defaults per kind, localizable via `<FF_Config messages.toast>`. See `/docs/svelte/toast`.

## 0.5.1

### Patch Changes

- [#282](https://github.com/jycouet/firstly/pull/282) [`a93d4c8`](https://github.com/jycouet/firstly/commit/a93d4c8815da30f2c4d701ddd7e3d8cdf39fd8f5) Thanks [@jycouet](https://github.com/jycouet)! - ffRepo (svelte): leaner surface. Rename `firstOnce` → `onFirst`; remove `draft`, `first`, `insert`, `update`, `deleteMany`. List handles (`load`/`listen`/`paginate`) are now read-only - write via `.repo` (+ `addItem`/`updateItem`/`removeItem` to reconcile). Editing lives on `one`/`create()` with argless `save()`/`delete()`.

  New `DemoGrid` (from `firstly/svelte`): a generic inline-CRUD table over any entity - props `entity` + `fields`, headers/placeholders from each field's `caption`.

## 0.5.0

### Minor Changes

- [#274](https://github.com/jycouet/firstly/pull/274) [`6114148`](https://github.com/jycouet/firstly/commit/61141482a06f0a006ae148f0645146c073a2fb3c) Thanks [@jycouet](https://github.com/jycouet)! - **BREAKING (svelte): `FF_Repo` class -> `ffRepo()` factory.** The reactive repo wrapper now takes a reactive options getter and a mode (`load` / `listen` / `paginate` / `one`), with built-in mutations (no-arg `save()`/`delete()` target the loaded `item`), client-side list reconcilers (`addItem`/`updateItem`/`removeItem`, with `addItem` positioning), `firstOnce`/`draft`, and permissions via `r.meta`. The old `new FF_Repo(E, { findOptions })` class is removed.

  One rule: anything not under `.repo` is reactive; every imperative read/write lives on `.repo` (the plain remult repo). The builder no longer hoists `findFirst`/`findId`/`insert`/... - use `ffRepo(E).repo.*`.

  Also new: `infiniteScroll` (svelte attachment, pairs with `paginate`), `stackHttpClient`/`withHeader` (core), `FF_Filter.containsWords` (multi-field search filter), `splitTrim` (formats), and exported types including the umbrella `FF_Repo` handle plus `FF_RepoBuilder`/`FF_RepoLoad`/`FF_RepoLive`/`FF_RepoPaginate`/`FF_RepoOne`/`QueryOptionsHelper`/`AggregateOptions`.

  Migration (see `/docs/svelte/ff-repo`):
  - `new FF_Repo(E, { findOptions: { where } })` -> `ffRepo(E).load(() => ({ where }))`
  - `new FF_Repo(E, { queryOptions })` + `.query()/.queryMore()/.queryRefresh()` -> `ffRepo(E).paginate(() => ({ ... }))` + `.more()/.refresh()`
  - `r.globalError` -> `r.error`
  - `r.fields` -> `r.meta.fields`; `r.metadata.apiInsertAllowed()` -> `r.meta.apiInsertAllowed()`
  - `repo(r.ent).update(...)` / `.insert(...)` -> `r.update(...)` / `r.insert(...)`
  - `r.aggregates.$count` unchanged; `skipAutoFetch` -> `enabled: false`

## 0.4.5

### Patch Changes

- [#270](https://github.com/jycouet/firstly/pull/270) [`ba5eec6`](https://github.com/jycouet/firstly/commit/ba5eec6b0099127c9b5424dd3fb44184b4c70b28) Thanks [@jycouet](https://github.com/jycouet)! - fix(core): add explicit return type to `FF_Entity` so its `.d.ts` is emitted.

  The inferred return type referenced a non-portable remult internal, so svelte-package silently skipped generating `FF_Entity.d.ts`. Consumers using the published package got `FF_Entity` typed as `any`, which made every entity option callback (`saving`, `displayValue`, ...) implicitly `any`.

## 0.4.4

### Patch Changes

- [#268](https://github.com/jycouet/firstly/pull/268) [`deb2aa3`](https://github.com/jycouet/firstly/commit/deb2aa3b2ad48e346e902812a4b22cba2e0c74ce) Thanks [@jycouet](https://github.com/jycouet)! - fix(carbone): export `Roles_Carbon` under its real name (was wrongly aliased to `Roles_Mail`, colliding with `firstly/mail`).

  Also expose `CarboneController` and the carbone entity classes from `firstly/carbone`, and `changeLogEntities` from `firstly/changeLog`, so consumers no longer need deep file imports.

## 0.4.3

### Patch Changes

- [#265](https://github.com/jycouet/firstly/pull/265) [`9105a8b`](https://github.com/jycouet/firstly/commit/9105a8b4ee47121fdfd8c33419c43bfa75f75c5c) Thanks [@jycouet](https://github.com/jycouet)! - mail: store `attachments` count in `Mail.metadata` so the admin UI can show how many files were sent.

## 0.4.2

### Patch Changes

- [#258](https://github.com/jycouet/firstly/pull/258) [`43f3f77`](https://github.com/jycouet/firstly/commit/43f3f77aa34f064720c90cdd240ac050a360ecf6) Thanks [@jycouet](https://github.com/jycouet)! - `firstly/changeLog`: export the `ChangeLog` entity class so apps can declare `@Relations` to it (e.g. linking changelog rows back to a `User`).

- [#253](https://github.com/jycouet/firstly/pull/253) [`6e203da`](https://github.com/jycouet/firstly/commit/6e203dab7bcbfe043c087703e8c199d42916015f) Thanks [@jycouet](https://github.com/jycouet)! - `firstly/mail`: export `MailSection`, persist nodemailer response into `Mail.metadata.transport` (so provider IDs like Resend's `re_...` are recoverable from the DB), ship drop-in `<WriteMail />` + `<LastMails />` admin components and an opt-in `MailController.sendTest` BackendMethod (`mail({ enableTest: true })`), plus a Resend docs section. Root: new `errorMessage(err)` helper that handles native `Error`, remult `ErrorInfo` rejections, and falls back to JSON instead of `[object Object]`.

- [#252](https://github.com/jycouet/firstly/pull/252) [`a4ee628`](https://github.com/jycouet/firstly/commit/a4ee628262ac290901039eba77cdf508dde48a2e) Thanks [@jycouet](https://github.com/jycouet)! - `firstly/sqlAdmin`: drop daisyUI dep, style with raw Tailwind, and add docs page.

## 0.4.1

### Patch Changes

- [#250](https://github.com/jycouet/firstly/pull/250) [`53916ad`](https://github.com/jycouet/firstly/commit/53916ad519835a47e3598afb68ce6d84356af944) Thanks [@jycouet](https://github.com/jycouet)! - Add `firstly/sqlAdmin` module: a drop-in `<SqlAdmin />` Svelte component plus a `BackendMethod` controller gated by `Roles_SqlAdmin.SqlAdmin_Admin` (or `FF_Role.FF_Role_Admin`). The component ships with prefilled queries (DB size, table sizes, indexes) and logs results as `for AI: <rows>` to the browser console for chrome-devtools / AI-agent inspection. `sqlAdmin({ path })` logs an AI hint on server start pointing to the page (default `/sql/admin`).

  Add `FF_Allow` and `FF_Filter` helpers (exported from `firstly`) for owner-only / admin-or-owner row checks and prefilters - usable in `allowApi*` and `apiPrefilter`. Both accept an entity generic (`FF_Allow.owner<Task>('userId')`) for type-safe column names; `col` defaults to `'userId'` if omitted. The `ownerOr<T>({ col?, roles })` variants are shortcuts for the "admin (or any role) OR owner" pattern.

## 0.4.0

### Minor Changes

- [#239](https://github.com/jycouet/firstly/pull/239) [`b70967d`](https://github.com/jycouet/firstly/commit/b70967d0536298ec6659653da45eaa9e8b8e7fb0) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove unused legacy components from `firstly/svelte`: `FF_Cell` (+ `FF_Cell_Caption/Display/Edit/Error/Hint`), `FF_Form`, `FF_Grid`, `FF_Layout`, `FF_Config` (+ `ff_Config.svelte.ts` with `daisyTheme`, `defaultTheme`, `emptyTheme`, `getTheme`, `setTheme`, `getDynamicCustomField`, `setDynamicCustomField`, `getClasses`, `FF_Theme`). Also removed `customField.ts` (`DynamicCustomField`, `CellMetadata`, `FieldGroup`, `getLayout`, and the related `FieldOptions.ui` / `EntityOptions.ui.getLayout` Remult module augmentations). Drops the `FF_Repo.getLayout()` instance method and the `internals/select/Select2.svelte` internal.

  Also deletes the duplicate dead `svelte/dialog/` tree (the canonical `dialog()` API is exported from `firstly/internals` and backed by `ui/dialog/`).

  Internal: removes the `task` demo module and its demo routes (`demo/FF_Cell`, `demo/FF_Form_Grid`, `demo/FF_Layout`, `demo/FF_Simple`).

- [#239](https://github.com/jycouet/firstly/pull/239) [`6589feb`](https://github.com/jycouet/firstly/commit/6589feba930250ffd842891f169faabfa498312b) Thanks [@jycouet](https://github.com/jycouet)! - Move `BaseEnum`, `FF_Entity`, `common` (`FF_Role`) source files from `lib/internals/` to `lib/core/`. The public export path is still `firstly/core`, which now also exports `FF_Role` (previously only available via `firstly/internals`) alongside the existing `BaseEnum`, `BaseEnumOptions`, `FF_Entity`, `isError`, `BaseItem`, `BaseItemLight`, `FF_Icon`. Consumers should migrate remaining `FF_Role` imports from `firstly/internals` to `firstly/core`.

- [#239](https://github.com/jycouet/firstly/pull/239) [`c4d2ee4`](https://github.com/jycouet/firstly/commit/c4d2ee4a4b7a1441c985c62b55f9fbacbfe02b9b) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Fold `firstly/core` into the root `firstly` export.

  `lib/utils/` (types + `tw`) moves into `lib/core/`. The `lib/core/index.ts` barrel is now empty — all core, frontend-safe primitives (`BaseEnum`, `BaseEnumOptions`, `BaseItem`, `BaseItemLight`, `FF_Icon`, `FF_Entity`, `FF_Role`, `isError`, `tryCatch`, `tryCatchSync`, `ResolvedType`, `UnArray`, `RecursivePartial`, `tw`) are re-exported from `lib/index.ts`, so consumers should import them from `'firstly'` directly.

  The `./core` subpath is removed from `package.json` exports. Migrate `from 'firstly/core'` -> `from 'firstly'`.

  Also moves the `RemultContext.feedbackOptions` module augmentation from `FeedbackController.ts` into `feedback/index.ts`, because some bundlers mangle `declare module 'remult'` inside a file that also has `@BackendMethod` decorators.

- [#239](https://github.com/jycouet/firstly/pull/239) [`b382619`](https://github.com/jycouet/firstly/commit/b3826192a26e529c45f78dffa59f9955e92f3257) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove the `firstly` CLI.

  The `bin` entry, the `./bin` export path, and `src/lib/bin/cmd.ts` are gone. Drops the `@clack/prompts` and `@kitql/internals` deps that only the CLI used.

- [#239](https://github.com/jycouet/firstly/pull/239) [`64c4644`](https://github.com/jycouet/firstly/commit/64c4644d8c75d7b757a2d4a4128cd0b4f5799c50) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove the `firstly({ ... })` server wrapper and the `./server`, let's now just use remult Modules

- [#239](https://github.com/jycouet/firstly/pull/239) [`a784113`](https://github.com/jycouet/firstly/commit/a784113217ba477fc36de3fee7ba6e82c8248cf5) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove `ModuleFF` and the `modulesFF` option.

  Use `Module` from `remult/server` directly (it has all the same features: `key`, `priority`, `entities`, `controllers`, `initApi`, `initRequest`, nested `modules`). Remult also ships its own `modulesFlatAndOrdered`, so firstly's version is gone too. The `firstly({ ... })` wrapper now only accepts remult's native `modules` option.

  Migration:

  ```ts
  // before
  import { ModuleFF } from 'firstly/server'
  new ModuleFF({ name: 'foo', modulesFF: [...] })

  // after
  import { Module } from 'remult/server'
  new Module({ key: 'foo', modules: [...] })
  ```

  If you used `m.log`, create your own: `const log = new Log(key)` at module scope and reference it from `initApi` / `initRequest`.

- [#239](https://github.com/jycouet/firstly/pull/239) [`7e49152`](https://github.com/jycouet/firstly/commit/7e49152d3af4f2ca40635ec0e1112a7ffa0de786) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove the deprecated internal `sveltekit` module and the `RemultContext.setHeaders` / `setCookie` / `deleteCookie` augmentation it set up.

  Nothing consumed those context methods. The module itself was marked `@deprecated` and was only auto-wired through `firstly({ ... })`. `remult.context.request` (the `RequestEvent`) is still augmented, so headers and cookies can be set via `remult.context.request.setHeaders(...)` / `remult.context.request.cookies.set(...)` directly.

### Patch Changes

- [#239](https://github.com/jycouet/firstly/pull/239) [`b70967d`](https://github.com/jycouet/firstly/commit/b70967d0536298ec6659653da45eaa9e8b8e7fb0) Thanks [@jycouet](https://github.com/jycouet)! - Bump deps: `nodemailer` 7 → 8 (+ `@types/nodemailer`), `tailwindcss` + `@tailwindcss/vite` 4.1.14 → 4.2.2, `vite-plugin-watch-and-run` 1.7.5 → 1.8.0, `@playwright/test` 1.58.2 → 1.59.1.

## 0.3.0

### Minor Changes

- [#232](https://github.com/jycouet/firstly/pull/232) [`fec8bc0`](https://github.com/jycouet/firstly/commit/fec8bc088733d63ce6752b0a764b786f80b736cb) Thanks [@jycouet](https://github.com/jycouet)! - BREAKING: Remove deprecated lucia-style auth module (`firstly/auth`, `firstly/auth/server`).

  Migrate to `better-auth` (see remult docs). Removed deps: `@oslojs/*`, `arctic`, `bcryptjs`.
  Also removed `packages/ui` (was only used for the auth UI).

### Patch Changes

- [#221](https://github.com/jycouet/firstly/pull/221) [`0b08040`](https://github.com/jycouet/firstly/commit/0b0804001c9a5bdff560fbcbb8b511c626d260f8) Thanks [@jycouet](https://github.com/jycouet)! - bump deps

## 0.2.1

### Patch Changes

- [#198](https://github.com/jycouet/firstly/pull/198) [`fa88af1`](https://github.com/jycouet/firstly/commit/fa88af1b1f405801dca642b243d4afdc9494de68) Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - `FF_Fields.dateOnly` and `FF_Fields.string` are removed, use `Fields.dateOnly` and `Fields.string` instead. _(allowNull & required are now fully independent! Like in remult)_

- [#185](https://github.com/jycouet/firstly/pull/185) [`9689241`](https://github.com/jycouet/firstly/commit/9689241824fb7066e019e64d6a8afdb439fc6838) Thanks [@jycouet](https://github.com/jycouet)! - sendMail() return data & error now

- [`a4e3c6e`](https://github.com/jycouet/firstly/commit/a4e3c6ecf52dd48c10115214109426a0e35e5e8b) Thanks [@jycouet](https://github.com/jycouet)! - fix auth ui (with new remult 3.1)

## 0.2.0

### Minor Changes

- [#176](https://github.com/jycouet/firstly/pull/176)
  [`1859bba`](https://github.com/jycouet/firstly/commit/1859bbaff86d3592900c7a18de1491203f8ebe8d)
  Thanks [@jycouet](https://github.com/jycouet)! - align with remult 3.1 (cuid to id)

### Patch Changes

- [#172](https://github.com/jycouet/firstly/pull/172)
  [`ab633f5`](https://github.com/jycouet/firstly/commit/ab633f59964f437c636f84c06e0ba82d11954c0a)
  Thanks [@jycouet](https://github.com/jycouet)! - new module https://carbone.io/ 🎉

## 0.1.3

### Patch Changes

- [`2348b71`](https://github.com/jycouet/firstly/commit/2348b7172d67b2357daf6cc57fbbd69d13345505)
  Thanks [@jycouet](https://github.com/jycouet)! - export `withChangeLog` to chain options for
  `@Entity`

- [`51cbd73`](https://github.com/jycouet/firstly/commit/51cbd7318797bf740627ae4cac8cc5074f7dab5e)
  Thanks [@jycouet](https://github.com/jycouet)! - export @kitql/helper as `h`

## 0.1.2

### Patch Changes

- [`e4d8b67`](https://github.com/jycouet/firstly/commit/e4d8b673787beee6d28e36aac1a404f49d690fb8)
  Thanks [@jycouet](https://github.com/jycouet)! - export interface for `changeLog` Module

## 0.1.1

### Patch Changes

- [`847af7a`](https://github.com/jycouet/firstly/commit/847af7a6d33224884032c80f63cb489106e6d40a)
  Thanks [@jycouet](https://github.com/jycouet)! - export mail & cron roles from client bundle

## 0.1.0

### Minor Changes

- [#140](https://github.com/jycouet/firstly/pull/140)
  [`94b2188`](https://github.com/jycouet/firstly/commit/94b2188c78772f94e7835ab933fcebbe2a37703c)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - deprecate firstly module in favor of
  remult module

  ```diff
  remultApi({
  --	modules: [],   // firstly modules
  ++	modulesFF: [], // firstly modules (deprecated)
  ++  modules: [],   // remult modules
  })

  Then, you can use `modules` level of `remult`

  ```

- [#153](https://github.com/jycouet/firstly/pull/153)
  [`f8ca698`](https://github.com/jycouet/firstly/commit/f8ca698aa2b4ec7cfe77f6e63486c0bf9a124946)
  Thanks [@jycouet](https://github.com/jycouet)! - all root import ... from `firstly` moved to
  `firstly/internals` (we will gradually add them back when needed

### Patch Changes

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`407ed4d`](https://github.com/jycouet/firstly/commit/407ed4db8f4b99f234932965b870d51f6a9c07ca)
  Thanks [@jycouet](https://github.com/jycouet)! - need to pass `redirect` to handleAuth manually

- [#102](https://github.com/jycouet/firstly/pull/102)
  [`f0effb9`](https://github.com/jycouet/firstly/commit/f0effb9e2dfa3f1c3070bc27c498d7f1e1ed877d)
  Thanks [@jycouet](https://github.com/jycouet)! - Prepare JYC 016

- [`c4606c5`](https://github.com/jycouet/firstly/commit/c4606c5ad5c0c9d90c830d99d1d2a919dc3750ec)
  Thanks [@jycouet](https://github.com/jycouet)! - role to roles

- [#108](https://github.com/jycouet/firstly/pull/108)
  [`cf100f4`](https://github.com/jycouet/firstly/commit/cf100f40a8462eca51acff3ac5d8779da78816ec)
  Thanks [@jycouet](https://github.com/jycouet)! - fix import paths

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`f30c737`](https://github.com/jycouet/firstly/commit/f30c73781d8f50da08fcdc25f1f7611133ea8b0c)
  Thanks [@jycouet](https://github.com/jycouet)! - switch mail engine to sailkit

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`5e1d67e`](https://github.com/jycouet/firstly/commit/5e1d67eb8f75127c3d729945e20b22c40184ee20)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - Auth Identifier got removed in favor
  of name in User table.

- [#110](https://github.com/jycouet/firstly/pull/110)
  [`0c66f11`](https://github.com/jycouet/firstly/commit/0c66f114dd95f65c0407abddbd647a66769142eb)
  Thanks [@jycouet](https://github.com/jycouet)! - add github in default ui (if configured)

## 0.1.0-next.5

### Patch Changes

- [`c4606c5`](https://github.com/jycouet/firstly/commit/c4606c5ad5c0c9d90c830d99d1d2a919dc3750ec)
  Thanks [@jycouet](https://github.com/jycouet)! - role to roles

## 0.1.0-next.4

### Minor Changes

- [#153](https://github.com/jycouet/firstly/pull/153)
  [`f8ca698`](https://github.com/jycouet/firstly/commit/f8ca698aa2b4ec7cfe77f6e63486c0bf9a124946)
  Thanks [@jycouet](https://github.com/jycouet)! - all root import ... from `firstly` moved to
  `firstly/internals` (we will gradually add them back when needed

## 0.1.0-next.3

### Minor Changes

- [#140](https://github.com/jycouet/firstly/pull/140)
  [`94b2188`](https://github.com/jycouet/firstly/commit/94b2188c78772f94e7835ab933fcebbe2a37703c)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - deprecate firstly module in favor of
  remult module

  ```diff
  remultApi({
  --	modules: [],   // firstly modules
  ++	modulesFF: [], // firstly modules
  })

  Then, you can use `modules` level of `remult`
  ```

### Patch Changes

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`407ed4d`](https://github.com/jycouet/firstly/commit/407ed4db8f4b99f234932965b870d51f6a9c07ca)
  Thanks [@jycouet](https://github.com/jycouet)! - need to pass `redirect` to handleAuth manually

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`f30c737`](https://github.com/jycouet/firstly/commit/f30c73781d8f50da08fcdc25f1f7611133ea8b0c)
  Thanks [@jycouet](https://github.com/jycouet)! - switch mail engine to sailkit

- [#117](https://github.com/jycouet/firstly/pull/117)
  [`5e1d67e`](https://github.com/jycouet/firstly/commit/5e1d67eb8f75127c3d729945e20b22c40184ee20)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] - Auth Identifier got removed in favor
  of name in User table.

## 0.0.16-next.2

### Patch Changes

- [#110](https://github.com/jycouet/firstly/pull/110)
  [`0c66f11`](https://github.com/jycouet/firstly/commit/0c66f114dd95f65c0407abddbd647a66769142eb)
  Thanks [@jycouet](https://github.com/jycouet)! - add github in default ui (if configured)

## 0.0.16-next.1

### Patch Changes

- [#108](https://github.com/jycouet/firstly/pull/108)
  [`cf100f4`](https://github.com/jycouet/firstly/commit/cf100f40a8462eca51acff3ac5d8779da78816ec)
  Thanks [@jycouet](https://github.com/jycouet)! - fix import paths

## 0.0.16-next.0

### Patch Changes

- [#102](https://github.com/jycouet/firstly/pull/102)
  [`f0effb9`](https://github.com/jycouet/firstly/commit/f0effb9e2dfa3f1c3070bc27c498d7f1e1ed877d)
  Thanks [@jycouet](https://github.com/jycouet)! - Prepare JYC 016

## 0.0.15

### Patch Changes

- [#98](https://github.com/jycouet/firstly/pull/98)
  [`0d708f6`](https://github.com/jycouet/firstly/commit/0d708f605dc9d2943730f68ebf99c1d2f8a49926)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 0.0.15

## 0.0.14

### Patch Changes

- [#85](https://github.com/jycouet/firstly/pull/85)
  [`993f733`](https://github.com/jycouet/firstly/commit/993f73374591f134d76e30f8b5e4402b4d3112d0)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 014

## 0.0.13

### Patch Changes

- [#66](https://github.com/jycouet/firstly/pull/66)
  [`7d8b323`](https://github.com/jycouet/firstly/commit/7d8b323b49d7d76b6d59ec887ed2e37a2238f201)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 013

## 0.0.12

### Patch Changes

- [#64](https://github.com/jycouet/firstly/pull/64)
  [`782ef9c`](https://github.com/jycouet/firstly/commit/782ef9c8a1d967950e4c17de59b3225bc28df5c2)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare JYC 012

## 0.0.11

### Patch Changes

- [#56](https://github.com/jycouet/firstly/pull/56)
  [`a1e8de0`](https://github.com/jycouet/firstly/commit/a1e8de0a8871b8f1aa6cd81ee20d24f6a3da4c3f)
  Thanks [@jycouet](https://github.com/jycouet)! - export changeLog module and not changeLogs

## 0.0.10

### Patch Changes

- [#51](https://github.com/jycouet/firstly/pull/51)
  [`803023a`](https://github.com/jycouet/firstly/commit/803023a6257c0bfb9396bc0a7bd454bd1281e26c)
  Thanks [@jycouet](https://github.com/jycouet)! - prepare 0.0.10

## 0.0.9

### Patch Changes

- [#43](https://github.com/jycouet/firstly/pull/43)
  [`46cfc39`](https://github.com/jycouet/firstly/commit/46cfc39090fc448a22c5ca95e45507a31ab8e2e0)
  Thanks [@jycouet](https://github.com/jycouet)! - better enum filter, grid action left/right, bump
  deps, opti session check, action after createOptionWhenNoResult

## 0.0.8

### Patch Changes

- [#27](https://github.com/jycouet/firstly/pull/27)
  [`66711b2`](https://github.com/jycouet/firstly/commit/66711b2373c69006d7ae5f06d8f4a6cb0e43670b)
  Thanks [@jycouet](https://github.com/jycouet)! - fix the session creation on signIn! (+default
  expiration is 30 days)

- [#27](https://github.com/jycouet/firstly/pull/27)
  [`0657c5c`](https://github.com/jycouet/firstly/commit/0657c5ca8b81673b493a6815a196a8c5351ecdf0)
  Thanks [@jycouet](https://github.com/jycouet)! - add uiStaticPath option in auth module to
  overwrite where are the static files for the module (dev option)

## 0.0.7

### Patch Changes

- [#25](https://github.com/jycouet/firstly/pull/25)
  [`54f2f6a`](https://github.com/jycouet/firstly/commit/54f2f6a833c1977c3163e91ce3172fa8edc9da47)
  Thanks [@jycouet](https://github.com/jycouet)! - adding e2e tests for accounts

- [#25](https://github.com/jycouet/firstly/pull/25)
  [`943e9d0`](https://github.com/jycouet/firstly/commit/943e9d0b6d5d6a631dc78661d188a76f254d4632)
  Thanks [@jycouet](https://github.com/jycouet)! - rename name to identifier in db

## 0.0.6

### Patch Changes

- [#23](https://github.com/jycouet/firstly/pull/23)
  [`c188eb3`](https://github.com/jycouet/firstly/commit/c188eb3d81a9e75b246387512621b5213bbe8dbd)
  Thanks [@jycouet](https://github.com/jycouet)! - fix auth & mail (logs & co)

## 0.0.5

### Patch Changes

- [#20](https://github.com/jycouet/firstly/pull/20)
  [`5b365a4`](https://github.com/jycouet/firstly/commit/5b365a474619f611b0eb0bfe38bbbb262acb3a7e)
  Thanks [@jycouet](https://github.com/jycouet)! - [BREAKING] Renaming almost all exports! (Some
  `FF_` and `ff_` only when direct collision with other packages)

- [#20](https://github.com/jycouet/firstly/pull/20)
  [`b1ea110`](https://github.com/jycouet/firstly/commit/b1ea1101c45c137e477a937a8c6d130b346b2bb9)
  Thanks [@jycouet](https://github.com/jycouet)! - tweak cli, update github auth

## 0.0.4

### Patch Changes

- [#16](https://github.com/jycouet/firstly/pull/16)
  [`ac00e70`](https://github.com/jycouet/firstly/commit/ac00e703af515009bbe7e078998f77ef3a9e9ce5)
  Thanks [@jycouet](https://github.com/jycouet)! - WIP next version / split client & server imports.

## 0.0.3

### Patch Changes

- [`aab33e7`](https://github.com/jycouet/firstly/commit/aab33e7681b06c8336c263471a87b97cc6186c6e)
  Thanks [@jycouet](https://github.com/jycouet)! - deploy ui in package (test!)

## 0.0.2

### Patch Changes

- [`f127fc7`](https://github.com/jycouet/firstly/commit/f127fc78e00f6464d8fbbebc10f3ffb43402fcc3)
  Thanks [@jycouet](https://github.com/jycouet)! - publish firstly for the first time ;)
