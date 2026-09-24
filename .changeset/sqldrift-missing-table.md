---
'firstly': patch
---

sqlAdmin drift: an entity whose table doesn't exist yet is reported as `missing` instead of failing the whole apply, errors now show the real message and failing statement (no more `[object Object]`).
