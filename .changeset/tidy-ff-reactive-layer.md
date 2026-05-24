---
'firstly': minor
---

Replace `ffRepo` with a cleaner `ff` surface: `ff(E).many(getter, strategy?)` (a list + editing draft + writes) and `ff(E).one(getter)` (a single bound record). `load`/`listen`/`paginate` are now the `strategy`, not separate verbs. Imperative work moves to remult's `repo(E)` (no `.repo` on the handle); `.meta` stays. Adds an exported `DemoForm` alongside `DemoGrid`.
