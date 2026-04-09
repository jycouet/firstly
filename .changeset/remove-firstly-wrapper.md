---
'firstly': minor
---

BREAKING: Remove the `firstly({ ... })` server wrapper and the `./server` export path.

With `ModuleFF` gone and remult shipping `Module` + `modulesFlatAndOrdered` natively, the `firstly()` wrapper had almost nothing left to do - just set a few default options and export a side-effect `entities` list. Consumers should call `remultApi` from `'remult/remult-sveltekit'` directly.

Migration:

```ts
// before
import { firstly, entities as entities_firstly } from 'firstly/server'
import { generateMigrations } from 'remult/migrations'

export const api = firstly({ dataProvider, modules: [ /* ... */ ] })
await generateMigrations({ entities: entities_firstly, dataProvider, /* ... */ })

// after
import { remultApi } from 'remult/remult-sveltekit'
import { generateMigrations } from 'remult/migrations'
import type { ClassType } from 'remult'

const allEntities: ClassType<any>[] = []
const modules = [ /* ... */ ]
allEntities.push(...modules.flatMap((m) => m.entities ?? []))

export const api = remultApi({
    logApiEndPoints: false, // previously baked into firstly()
    admin: true,
    defaultGetLimit: 25,
    dataProvider,
    modules,
})
await generateMigrations({ entities: allEntities, dataProvider, /* ... */ })
```

Also removed the unused `RemultContext.request` type augmentation from `firstly/lib/server`, and moved the `feedbackOptions` augmentation from `firstly/feedback/server` to `firstly/feedback/FeedbackController.ts` so anyone importing `firstly/feedback` automatically picks it up.
