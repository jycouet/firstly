---
'firstly': minor
---

Requires remult >= 3.5. sqlAdmin drift: index builders and relation index coverage follow remult `NullSort.order`, with `NULLS FIRST` on `allowNull` columns when `asc` is `NULLS FIRST`, and drop the other `X` / `X_NF` variant so the index swaps. `nullSort` overrides.
