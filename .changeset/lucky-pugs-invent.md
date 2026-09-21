---
'firstly': patch
---

`ff` handles: read failed writes through `errorMessage()`. Remult rejects with a plain object, not
an `Error`, so `handle.error` used to end up as the string `[object Object]` on a 403.
