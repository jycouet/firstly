---
'firstly': patch
---

`withShortTermCache`: mutations (POST writes, PUT, PATCH, DELETE) now clear the cache once they settle, so a follow-up refresh no longer serves the pre-mutation read.
