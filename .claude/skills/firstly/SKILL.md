---
name: firstly
description: Firstly-specific patterns on top of Remult - FF_Entity (with built-in changelog), BaseEnum, published modules (mail, cron, changeLog), and the Boutique copy-paste recipes (auth). Use when the user mentions firstly, FF_Entity, BaseEnum, firstly/mail, firstly/cron, or the boutique folder, or when building with `firstly` alongside Remult. Framework-agnostic but SvelteKit is the reference setup.
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
import { FF_Entity } from 'firstly'
import { Fields } from 'remult'

@FF_Entity<Task>('tasks', {
  allowApiCrud: true,
  saved: async (entity, event) => {
    if (event.isNew) { /* ... */ }
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
import { BaseEnum } from 'firstly'
import { ValueListFieldType, getValueList } from 'remult'

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
import { mail } from 'firstly/mail/server'
import { cron } from 'firstly/cron/server'

export const api = remultApi({
  modules: [
    mail(),
    cron([
      { topic: 'nightly', cronTime: '0 3 * * *', onTick: () => ({ status: 'ok' }) },
    ]),
  ],
})
```

Available today: `mail`, `cron`, `changeLog`. See [firstly.fun](https://firstly.fun) for the full list.

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
import { Roles_Auth } from '$lib/modules/auth/entities'
import { Roles_Mail } from 'firstly/mail'
import { Roles_Cron } from 'firstly/cron'

export const Roles = {
  Admin: 'admin',
  ...Roles_Auth,  // Auth.Admin
  ...Roles_Mail,  // Mail.Admin
  ...Roles_Cron,  // Cron.Admin
} as const
```

Use `Roles.*` in `allowApi*` decorators and assign them to users via the auth boutique's `addRolesToUser` helper or `SUPER_ADMIN_EMAILS`.

## Naming - `FF_` Prefix

Types and helpers exported by firstly that could collide with user code use the `FF_` prefix: `FF_Entity`, `FF_Role`, `FF_Icon`, `FF_LogToConsole`. If you see it in an import path, it's firstly's.
