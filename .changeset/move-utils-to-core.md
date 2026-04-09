---
'firstly': minor
---

BREAKING: Fold `firstly/core` into the root `firstly` export.

`lib/utils/` (types + `tw`) moves into `lib/core/`. The `lib/core/index.ts` barrel is now empty — all core, frontend-safe primitives (`BaseEnum`, `BaseEnumOptions`, `BaseItem`, `BaseItemLight`, `FF_Icon`, `FF_Entity`, `FF_Role`, `isError`, `tryCatch`, `tryCatchSync`, `ResolvedType`, `UnArray`, `RecursivePartial`, `tw`) are re-exported from `lib/index.ts`, so consumers should import them from `'firstly'` directly.

The `./core` subpath is removed from `package.json` exports. Migrate `from 'firstly/core'` -> `from 'firstly'`.

Also moves the `RemultContext.feedbackOptions` module augmentation from `FeedbackController.ts` into `feedback/index.ts`, because some bundlers mangle `declare module 'remult'` inside a file that also has `@BackendMethod` decorators.
