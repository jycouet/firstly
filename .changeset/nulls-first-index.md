---
'firstly': patch
---

sqlAdmin drift: index builders and relation index coverage put `NULLS FIRST` on `allowNull` columns when remult `NullSort.order.asc` is `NULLS FIRST` (remult 3.5). `nullsFirst` overrides.
