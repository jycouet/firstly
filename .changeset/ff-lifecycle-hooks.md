---
'firstly': patch
---

ff: add `onNew` and `onIssue` lifecycle hooks to the reactive handle (and make `onFirst` chainable)

- **`onItem(record => …)`** (`one` mode) / **`onItems(items => …)`** (list modes) - run after each fetch with the loaded data, mirroring the handle's `.item` / `.items` (replaces the old `storeList`/`storeItem` `onNewData`). `onItem` fires only when a row is found - a not-found goes to `onIssue`. `onFirst` stays the once-only seed.
- **`onIssue(issue => …)`** - runs when a read doesn't yield the expected data. `issue` is `{ kind: 'notFound' | 'forbidden' | 'error', status?, message? }`; switch on `kind` to react (e.g. redirect). A `one` query that resolves with no row reports `{ kind: 'notFound', status: 404 }`; a rejected read reports `forbidden` (403) or `error`.
- All three hooks are now chainable: `ff(E).one(getter).onIssue(…).onNew(…).onFirst(…)`.
- **`ff(E).one()` accepts `{ id }` or `{ where }`** (mutually exclusive - a type error if both). `{ id }` loads by primary key via `findId` (no `_sort`/`_limit` on a unique lookup, and dedups with other findId callers); `{ where }` loads via `findFirst` (with optional `orderBy`). `{ id }` re-runs reactively when the id changes.
