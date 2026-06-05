---
'firstly': patch
---

fix(deps): declare `@kitql/helpers` as a runtime dependency

`esm/index.js` does `import * as h from '@kitql/helpers'` (and re-exports it /
builds `ff_Log` from it), but the package only listed it under
`devDependencies`. Consumers that didn't happen to hoist it got
`Cannot find module '@kitql/helpers'` at runtime. Moved it into `dependencies`.
