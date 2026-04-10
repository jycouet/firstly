---
'firstly': minor
---

BREAKING: Remove `ModuleFF` and the `modulesFF` option.

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
